/* The MIT License (MIT)

Copyright (c) 2015 Antal Orcsik <aorcsik@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

function Queue(size, data) {
    this.max = size;
    this.data = data || new Array();
}

Queue.prototype.add = function(object) {
    this.data.push(object);
    if (this.data.length > this.max) {
        this.data = this.data.slice(1);
    }
    return this;
};

Queue.prototype.pop = function() {
    var x = this.data[0];
    if (this.size() == 1) {
        this.data = [];
    } else {
        this.data = this.data.slice(1);
    }
    return x;
};

Queue.prototype.size = function() {
    return this.data.length;
};

Queue.prototype.forEach = function(fun) {
    this.data.forEach(fun);
};


function Pulse(container, options) {
    var self = this;

    /* configure */

    this.size = options['size'] || 150;
    this.ping_map = options['ming_map'] || [5, -2, 3, 0];
    this.color = this.colorToArray(options['color'] || [0, 250, 0]);
    this.background = options['background'] ? this.colorToArray(options['background']) : null;

    /* initialize */

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size * 2;
    this.canvas.height = this.size * 2;
    this.canvas.style.width = this.size + "px";
    this.context = this.canvas.getContext('2d');
    this.reset();
    container.appendChild(this.canvas);

    this.dot_size = this.size / 25;
    this.tail_queue = new Queue(Math.floor(70));
    this.cursor = [0, this.size];
    this.target = this.size;
    this.targets = null;
    
    this.ping_map = this.ping_map.map(function(item) {
        return self.size + (item ? self.size / item : 0);
    });
}

Pulse.prototype.colorToArray = function(color) {
    if (Object.prototype.toString.call(color) === '[object Array]') {
        return color.slice(0, 3).map(function(item) {
            return Math.min(Math.abs(parseInt(item)), 255);
        });
    }
    if (typeof color === 'string') {
        var m = color.trim().match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
        if (m != null) {
            return [m[1], m[2], m[3]].map(function(item) {
                return parseInt(item + "" + item, 16);
            });
        }
        m = color.trim().match(/^#([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])$/);
        if (m != null) {
            return [m[1], m[2], m[3]].map(function(item) {
                return parseInt(item, 16);
            });
        }
    }
    throw new Error('This is not a supported color value: ' + color);
};

Pulse.prototype.ping = function() {
    this.targets = new Queue(3, this.ping_map);
};

Pulse.prototype.reset = function() {
    
    if (this.background) {
        this.context.fillStyle = "rgb(" + this.background[0] + "," + this.background[1] + "," + this.background[2] + ")";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

Pulse.prototype.render = function() {
    var self = this;

    if (this.background) {
        self.context.fillStyle = "rgb(" + self.background[0] + "," + self.background[1] + "," + self.background[2] + ")";
    }
    this.tail_queue.forEach(function(pos, idx) {
        var x = pos[0];
        var y = pos[1];
        if (self.background) {
            self.context.fillRect(x - self.dot_size, y - self.dot_size, self.dot_size * 2, self.dot_size * 2);
        } else {
            self.context.clearRect(x - self.dot_size, y - self.dot_size, self.dot_size * 2, self.dot_size * 2);
        }
    });

    this.tail_queue.add([this.cursor[0], this.cursor[1]]);
    
    var speed = this.dot_size;
    if (this.cursor[1] != this.target) {
        var diff = this.target - this.cursor[1];
        var dir = diff / Math.abs(diff);
        this.cursor[1] += dir * this.dot_size;
        if (dir > 0) {
            if (this.cursor[1] > this.target) this.target = this.targets.pop();
        } else {
            if (this.cursor[1] < this.target) this.target = this.targets.pop();
        }
        speed = this.dot_size / 10;
    } else if (this.targets && this.targets.size() > 0) {
        this.target = this.targets.pop();
        speed = this.dot_size / 10;
    }

    this.cursor[0] += speed;
    if (this.cursor[0] > this.size * 2) {
        this.cursor[0] = 0;
    }

    if ((!this.targets || this.targets.size() == 0) && 
        this.cursor[0] > this.size - (this.size / 10) && 
        this.cursor[0] < this.size + (this.size / 10)) {
        this.ping();
    }

    this.tail_queue.forEach(function(pos, idx) {
        var x = pos[0];
        var y = pos[1];
        var perc = idx / self.tail_queue.data.length;
        var color = "rgba(" + self.color[0] + ", " + self.color[1]+ ", " + self.color[2] + ", " + perc + ")";

        self.context.beginPath();
        self.context.arc(x, y, self.dot_size * perc, 0, 2 * Math.PI, false);
        self.context.fillStyle = color;
        self.context.fill();
    });

    window.requestAnimationFrame(function(time){
        self.render();
    });
};
