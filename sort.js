/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2014 Konrad Borowski
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to
 * do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use strict"
var lastColumn = 'Name'
var body = document.getElementsByTagName('tbody')[0]
var rows = _.toArray(body.getElementsByTagName('tr'))

function getServerName(row) {
    // Gets the first cell in row, containing the server name.
    // \xA0 is non-breaking space.
    return row.childNodes[1].textContent.trim().split("\xA0")[1]
}

function resortHighlighted() {
    // Put highlighted columns at top
    var sortedRows = _.sortBy(rows, function highlightSort(row) {
        return !row.getAttribute('class')
    })

    _.each(sortedRows, function rowPusher(row) {
        body.appendChild(row)
    })
}

function getServers() {
    return _.filter(
        location.hash.substring(1).split(','),
        function isNumber(server) {
            return /^\d+$/.test(server)
        }
    )
}

window.onhashchange = function onhashchange() {
    // If location.hash exists, split it by ",", otherwise set it to empty
    // array
    var servers = getServers()
    var set = _.groupBy(servers)
    _.each(rows, function highlighter(row, i) {
        // Non-breaking space
        if (set[getServerName(row)]) {
            row.setAttribute('class', 'selected')
        }
        // The rows might be already selected
        else {
            row.removeAttribute('class')
        }
    })
    resortHighlighted()
}

onhashchange()

_.each(document.getElementsByTagName('th'), function th(elem, i) {
    elem.onclick = function onclick() {
        var name = this.textContent.trim()

        if (lastColumn === name) {
            // The only reason why array is reversed is so that stable
            // sort could work correctly, so you could sort multiple
            // ways.
            rows.reverse()
        }

        rows = _.sortBy(rows, function sort(row) {
            var node = row.childNodes[i + 1]
            var value = node.firstChild.textContent.trim()
            switch (name) {
            // Numbers (more is at the top)
            case 'Disk space':
            case 'Bandwidth':
            case 'RAM':
            case 'Burst (OpenVZ)':
            case 'vSwap (OpenVZ)':
            case 'IPv6 addresses':
            case 'Connection speed':
                // Infinity
                if (value === "\u221E") return -Infinity

                var result = +(/\d+(?:\.\d+)?/.exec(value) || [-1])[0]

                // If the value contains GB or TB, multiply it (it doesn't
                // apply to certain counts, like IPv6 addresses, but running
                // this code shouldn't hurt anything).
                if (value.indexOf("G") !== -1)
                    result *= 1024
                else if (value.indexOf("T") !== -1)
                    result *= 1024 * 1024
                
                var power = node.getElementsByTagName('sup')[0]
                if (power) {
                    result = Math.pow(result, +power.textContent)
                }

                // Negative, so less is more
                return -result

            // Numbers (less is at the top)
            case 'Name':
                return +/\d+/.exec(value)

            // Booleans
            case 'IRC usage':
            case 'IRC bots':
                return {
                    Yes: 1,
                    Unknown: 2,
                    No: 3
                }[value]

            // United States at end
            case 'Location':
                return value.substring(0, 3) === 'US ' ? 'ZZZ' + value : value

            // Normal strings
            default:
                return value
            }
        })

        if (lastColumn === name) {
            // Actually reverse array.
            rows.reverse()
            lastColumn = null
        }
        else {
            lastColumn = name
        }

        resortHighlighted()

        // Apply sorted class
        document.getElementsByClassName('sorted')[0].removeAttribute('class')
        this.setAttribute('class', 'sorted')
    }
})

_.each(rows, function tr(elem) {
    elem.onclick = function onclick() {
        var i = getServerName(this)
        var servers = getServers()
        // Remove highlight if highlighted
        if (this.getAttribute('class')) {
            this.removeAttribute('class')
            // Remove row from servers
            servers.splice(servers.indexOf(i), 1)
        }
        // Highlight if not
        else {
            this.setAttribute('class', 'selected')
            servers.push(i)
        }
        // Update hash
        location.hash = "#" + servers.sort(function sort(a, b) {
            return a - b
        })

        resortHighlighted()
    }
})

_.each(document.getElementsByTagName('a'), function a(link) {
    link.onclick = function onclick(e) {
        // Links are links, not rows.
        e.stopPropagation()
    }
})
