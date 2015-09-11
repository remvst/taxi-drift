var _ = window,
    raf = (function(){
        return  _.requestAnimationFrame       ||
                _.webkitRequestAnimationFrame ||
                _.mozRequestAnimationFrame    ||
                function(c){
                    setTimeout(c, 1000 / 60);
                };
    })(),
    M = Math,
    abs = M.abs,
    to = setTimeout;


function rd(a, b){
    if(b === undefined){
        b = a;
        a = 0;
    }
	return M.random() * (b - a) + a;
};

function rp(a){
    return a[~~(rd(a.length))];
};

function normalizeAngle(a){
	while (a < -Math.PI) a += Math.PI * 2;
	while (a > Math.PI) a -= Math.PI * 2;
	return a;
};

function xt(o, x){
    var r = {};

    // Copying
    for(var i in o){
        r[i] = o[i];
    }

    // Overriding
    for(var i in x){
        r[i] = x[i];
    }

    return r;
};

// Shortcuts
var p = CanvasRenderingContext2D.prototype;
p.fr = p.fillRect;
p.sv = p.save;
p.rs = p.restore;
p.tr = p.translate;
p.lt = p.lineTo;
p.mt = p.moveTo;
p.sc = p.scale;
p.bp = p.beginPath;
p.clg = p.createLinearGradient;
p.rt = p.rotate;
p.ft = p.fillText;

p.alpha = function(x){
    this.globalAlpha = x;
};

p.fs = function(p){
    this.fillStyle = p;
};

p.di = function(i, x, y){
    this.drawImage.apply(this, arguments);
};

// Adding all these functions to the global scope
for(var i in p){
    _[i] = (function(f){
        return function(){
            c[f].apply(c, arguments);
        }
    })(i);
}

function shape(points, color){
    var tx = points[0].x,
        ty = points[0].y;

    c.sv();
    c.tr(tx, ty);

    c.fs(color);
    c.bp();
    c.moveTo(0, 0);
    for(var i = 1 ; i < points.length ; i++){
        c.lineTo(points[i].x - tx, points[i].y - ty);
    }
    c.closePath();
    c.fill();

    c.rs();
};

function cache(w, h, rr, t){
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;

    var r = c.getContext('2d');
    rr(c, r, w, h);

    if(t === 'pattern'){
        var p = r.createPattern(c, 'repeat');
        p.width = w;
        p.height = h;
        return p;
    }

    return c;
};

function noop(){};

function limit(x, a, b){
    return M.max(a, M.min(b, x));
};

function shuffle(o){
    for(var j, x, i = o.length; i; j = ~~(M.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function dist(x1, y1, x2, y2){
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
};



function createCycle(pts){
    // Smooth angles
    var l = 40,
        cur,
        next,
        prev,
        res = [],
        anglePrev,
        angleNext;
    for(var i = 0 ; i < pts.length ; i++){
        cur = pts[i];
        next = pts[(i + 1) % pts.length];
        prev = pts[(i - 1 + pts.length) % pts.length];

        anglePrev = Math.atan2(prev.y - cur.y, prev.x - cur.x);
        angleNext = Math.atan2(next.y - cur.y, next.x - cur.x);

        // Smooth before
        res.push({
            x: cur.x + l * Math.cos(anglePrev),
            y: cur.y + l * Math.sin(anglePrev)
        });
        res.push({
            x: cur.x + l * Math.cos(angleNext),
            y: cur.y + l * Math.sin(angleNext)
        });
    }


    // Linking points together
    for(var i = 0 ; i < res.length ; i++){
        res[i].next = res[(i + 1) % res.length];
    }

    return res[0];
};

function newCar(color, noLights){
	return cache(52, 24, function(c, r){
        with(r){
            fs('rgba(0,0,0,1)');
            fr(0, 0, c.width, c.height);

            tr((c.width - 50) / 2, (c.height - 22) / 2);

    		fs(color);
    		fr(0, 0, 50, 22);

    		fs('#000');
    		fr(10, 3, 5, 16);
    		fr(30, 3, 10, 16);
    		fr(15, 1, 7, 1);
    		fr(23, 1, 7, 1);
    		fr(15, 20, 7, 1);
    		fr(23, 20, 7, 1);

            if(!noLights){
        		fs('#ff0');
        		fr(48, 0, 2, 3);
        		fr(48, 19, 2, 3);

        		fs('#f00');
        		fr(0, 0, 2, 3);
        		fr(0, 19, 2, 3);
            }
        }
	});
};

var P = {
	w: 700,
	h: 700,
	v: 130
};

function Game(){
	window.rotation = true;

	this.can = document.querySelector('canvas');
	with(this.can){
		width = P.w;
		height = P.h;
	}

	this.ctx = window.c = this.can.getContext('2d');

	this.start();

	// Resizing
	this.resize();
	addEventListener('resize', this.resize, false);

	addEventListener('keydown', this.keyDown.bind(this), false);
	addEventListener('keyup', this.keyUp.bind(this), false);

	// Loop
	this.lastFrame = Date.now();
	raf(function(){
		G.cycle();
		raf(arguments.callee);
	});

	this.elapsedList = [];
	this.frameCount = 0;
	this.frameCountStart = Date.now();
};

Game.prototype = {
	start: function(){
		this.world = new World();

		this.menu = new Home();
	},
	restart: function(){
		this.world = new World();

		this.menu = null;
	},
	gameOver: function(){
		this.menu = new End();
	},
	cycle: function(){
		sv();
		sc(this.resolution, this.resolution);

		var n = Date.now(),
			e = (n - this.lastFrame) / 1000;

		//e = M.min(e, 1 / 30);
		this.lastFrame = n;

		this.world.cycle(e);
		if(this.menu){
			this.menu.cycle(e);
		}

		Easing.cycle(e);

		this.frameCount++;
		if(this.frameCount === 200){
			var totalTime = Date.now() - this.frameCountStart;
			var fps = this.frameCount / (totalTime / 1000);
			if(fps < 30){
				this.setResolution(.6);
			}
		}

		/*fillStyle = '#fff';
		font = '20pt Arial';
		textBaseline = 'top';
		textAlign = 'left';
		ft(~~(1 / e) + 'fps', 10, 10);

		this.elapsedList.push(e);
		if(this.elapsedList.length > 100){
			this.elapsedList.shift();
		}

		c.fillStyle = '#000';
		c.strokeStyle = '#fff';
		c.fr(0, 0, this.elapsedList.length * 2, 100);
		c.strokeRect(0, 0, this.elapsedList.length * 2, 100);

		var fps;
		c.strokeStyle = '#fff'
		c.beginPath();
		for(var i = 0, x = 0 ; i < this.elapsedList.length ; i++, x+=2){
			fps = ~~(1 / this.elapsedList[i]);
			//c.fr(x, 100 - (fps / 60) * 100, 2, 2);
			c.lineTo(x, 100 - (fps / 60) * 100);
		}
		c.stroke();*/

		rs();
	},
	newWorld: function(){
		this.world = new World();
	},
	resize : function(){
		to(function(){
			var maxWidth = innerWidth,
				maxHeight = innerHeight,

				availableRatio = maxWidth / maxHeight,
				baseRatio = P.w / P.h,
				ratioDifference = abs(availableRatio - baseRatio),
				width,
				height,
				s = document.getElementById('canvascontainer').style;

			if(availableRatio <= baseRatio){
				width = maxWidth;
				height = width / baseRatio;
			}else{
				height = maxHeight;
				width = height * baseRatio;
			}

			s.width = width + 'px';
			s.height = height + 'px';
		},100);
	},
	keyDown: function(e){
		if(e.keyCode == 32 || e.keyCode == 40 || e.keyCode == 38) e.preventDefault();
		if(e.keyCode == 82) window.rotation = !window.rotation;
		if(this.menu) return this.menu.keyDown(e.keyCode);
		this.world.keyDown(e.keyCode);
	},
	keyUp: function(e){
		if(this.menu) return;
		this.world.keyUp(e.keyCode);
	},
	setResolution: function(r){
		this.can.width = P.w * r;
		this.can.height = P.h * r;

		this.resolution = r;
	}
};

function World(){
	wld = this;

	this.score = 0;

	this.particles = [];
	this.cars = [];
	this.buildings = [];
	this.clients = [];
	this.clientSpots = [];
	this.textures = [];
	this.trails = [];

	this.down = {};

	this.t = 0;

	var w = 8000,
		h = 8000,
		bt = 100;

	//this.addBuilding(new Building(-bt, 0, bt, h));
	//this.addBuilding(new Building(w, 0, bt, h));
	//this.addBuilding(new Building(0, -bt, w, bt));
	//this.addBuilding(new Building(0, h, w, bt));

	var bs = 300;
	var sw = 300;

	var cellSize = 900,
		swSize = 50,
		roadSize = 200,
		xwSize = 50;

	var building = function(x, y, w, h, b){};

	var park = function(x, y, w, h, b){
		var tex = new Texture(grass, x, y, w, h);
		wld.textures.push(tex)

		// I'm lazy so I'm adding an invisible building to get cycles and shit
		b.visible = false;
		b.collides = false;

		for(var i = 0 ; i < 10 ; i++){
			var t = new Tree(tex.x + ~~rd(0, tex.w), tex.y + ~~rd(0, tex.h));
			wld.buildings.push(t);
		}
	};

	var lot = function(x, y, w, h, b){
		var tex = new Texture(parking, x, y, w, h);
		wld.textures.push(tex);

		// I'm lazy so I'm adding an invisible building to get cycles and shit
		b.visible = false;
		b.collides = false;

		// Exits
		wld.textures.push(new Texture(road, tex.x - swSize, tex.y + swSize * 2, swSize, swSize * 2));
		wld.textures.push(new Texture(road, tex.x + tex.w, tex.y + swSize * 2, swSize, swSize * 2));
		wld.textures.push(new Texture(road, tex.x - swSize, tex.y + tex.h - swSize * 4, swSize, swSize * 2));
		wld.textures.push(new Texture(road, tex.x + tex.w, tex.y + tex.h - swSize * 4, swSize, swSize * 2));

		// Random cars
		var positions = [];
		for(var x = tex.x + swSize / 2 ; x < tex.x + tex.w - swSize / 2 ; x += swSize){
			for(var y = tex.y + swSize ; y < tex.y + tex.h ; y += parking.height){
				positions.push({ x: x, y: y });
				positions.push({ x: x, y: y + swSize * 4 });
			}
		}

		for(var i = 0 ; i < 10 ; i++){
			var ind = ~~rd(positions.length);
			var pos = positions[ind];
			positions.splice(ind, 1);

			var s = parking.width / 2;

			var c = new Enemy();
			c.x = pos.x;
			c.y = pos.y;
			c.rotation = rp([M.PI / 2, -M.PI / 2])
			wld.addCar(c);
		}
	};

	var cell = function(x, y, w, h){
		// First, adding a sidewalk
		var tex = new Texture(
			sidewalk,
			x - swSize,
			y - swSize,
			w + 2 * swSize,
			h + 2 * swSize
		);
		wld.textures.push(tex);

		var b = new Building(x, y, w, h);
		wld.buildings.push(b);

		// Then, random type of area
		var type = rp([park, park, building, building, building, lot]);
		type(x, y, w, h, b);
	};

	var cols = 10,
		rows = 10;

	for(var row = 0 ; row <= rows ; row++){
		for(var col = 0 ; col <= cols ; col++){
			// Crosswalks
			wld.textures.push(new Texture(
				xwalkv,
				col * cellSize - roadSize / 2 - xwSize,
				row * cellSize - roadSize / 2,
				xwSize,
				roadSize
			));
			wld.textures.push(new Texture(
				xwalkv,
				col * cellSize + roadSize / 2,
				row * cellSize - roadSize / 2,
				xwSize,
				roadSize
			));
			wld.textures.push(new Texture(
				xwalkh,
				col * cellSize - roadSize / 2,
				row * cellSize - roadSize / 2 - xwSize,
				roadSize,
				xwSize
			));
			wld.textures.push(new Texture(
				xwalkh,
				col * cellSize - roadSize / 2,
				row * cellSize + roadSize / 2,
				roadSize,
				xwSize
			));

			// Road lines
			wld.textures.push(new Texture(
				hline,
				col * cellSize + roadSize / 2 + xwSize,
				row * cellSize - hline.height / 2,
				cellSize - roadSize - xwSize * 2,
				hline.height
			));
			wld.textures.push(new Texture(
				vline,
				col * cellSize - vline.width / 2,
				row * cellSize + roadSize / 2 + xwSize,
				vline.width,
				cellSize - roadSize - xwSize * 2
			));
		}
	}

	var double = false;
	for(var row = 0 ; row < rows ; row++){
		for(var col = 0 ; col < cols ; col++){
			double = !double && col < cols -1 && Math.random() < .5;

			var x = col * cellSize + swSize + roadSize / 2;
			var y = row * cellSize + swSize + roadSize / 2;
			var w = cellSize - 2 * swSize - roadSize;
			var h = cellSize - 2 * swSize - roadSize;

			if(double){
				w = w * 2 + roadSize + 2 * swSize;

				col++;
			}

			cell(x, y, w, h);
		}
	}

	// water
	var sizes = [
		[-roadSize / 2 - swSize, -roadSize / 2 - swSize, cols * cellSize + 4000, -2000],
		[-roadSize / 2 - swSize, rows * cellSize + roadSize / 2 + swSize, cols * cellSize + 4000, 2000],
		[-roadSize / 2 - swSize, -roadSize / 2 - 2000, -2000, rows * cellSize + 6000],
		[cols * cellSize + roadSize / 2 + swSize, -roadSize / 2 - 2000, 2000, rows * cellSize + 6000]
	];
	sizes.forEach(function(s){
		var b = new Building(s[0], s[1], s[2], s[3]);
		b.visible = false;
		wld.buildings.push(b);
		wld.textures.push(new Texture(water, s[0], s[1], s[2], s[3]));
	});

	// Surround with sidewalks
	this.textures.push(new Texture(
		sidewalk,
		-roadSize / 2 - swSize,
		-roadSize / 2 - swSize,
		cols * cellSize + 2 * swSize + roadSize,
		swSize
	));
	this.textures.push(new Texture(
		sidewalk,
		-roadSize / 2 - swSize,
		rows * cellSize + roadSize / 2,
		cols * cellSize + 2 * swSize + roadSize,
		swSize
	));
	this.textures.push(new Texture(
		sidewalk,
		-roadSize / 2 - swSize,
		-roadSize / 2 - swSize,
		swSize,
		rows * cellSize + 2 * swSize + roadSize
	));
	this.textures.push(new Texture(
		sidewalk,
		cols * cellSize + roadSize / 2,
		-roadSize / 2 - swSize,
		swSize,
		rows * cellSize + 2 * swSize + roadSize
	));

	this.player = this.addCar(new Player());
	this.player.x = cols / 2 * cellSize,
	this.player.y = rows / 2 * cellSize;

	this.camX = this.player.x - P.w / 2;
	this.camY = this.player.y - P.h / 2;
	this.camRotation = 0;

	for(var i = 0 ; i < this.buildings.length - 4 ; i++){
		var b = this.buildings[i];

		if(b.visible && b.collides || !b.visible && !b.collides){
			var cycle = b.getCycle();
			if(cycle){
				var enemy = this.addCar(new Enemy());
				enemy.x = cycle.x;
				enemy.y = cycle.y;
				enemy.follow(cycle);
			}

			this.clientSpots = this.clientSpots.concat(b.getCorners(25));
		}
	}

	this.nextClientSpawn = 0;
	this.timeleft = 180;
};

World.prototype = {
	cycle: function(e){
		this.t += e;

		this.nextClientSpawn -= e;
		if(this.nextClientSpawn <= 0){
			this.respawnClients();
			this.nextClientSpawn = 5;
		}

		// Background
		fs(road);
		fr(0, 0, P.w, P.h);

		for(var i in this.cars){
			this.cars[i].cycle(e);
		}

		// TODO handle camera
		//var angle = !this.player.dead ? this.player.moveAngle : this.player.moveAngle + M.PI;

		//var idealX = this.player.x - P.w / 2 + M.cos(angle) * this.player.speed * .4;
		//var idealY = this.player.y - P.h / 2 + M.sin(angle) * this.player.speed * .4;

		//idealX = wld.player.x - P.w / 2 + M.cos(angle) * this.player.speed * .4;
		//idealY = wld.player.y - P.h / 2 + M.sin(angle) * this.player.speed * .4;

		var camSpeed = !this.player.dead ? 600 : 100;

		//var distance = dist(idealX, idealY, this.camX, this.camY);
		//var appliedDistance = limit(distance, -camSpeed * e, camSpeed * e);

		//var angle = Math.atan2(idealY - this.camY, idealX - this.camX);
		//this.camX += Math.cos(angle) * appliedDistance;
		//this.camY += Math.sin(angle) * appliedDistance;

		this.camX = wld.player.x - P.w / 2 + M.cos(wld.player.moveAngle) * 100;
		this.camY = wld.player.y - P.h / 2 + M.sin(wld.player.moveAngle) * 100;

		if(this.shakeTime > 0){
			this.camX += rd(-10, 10);
			this.camY += rd(-10, 10);
		}

		//this.camX = idealX;
		//this.camY = idealX;

		var idealRotation = -this.player.rotation - M.PI / 2;
		var diff = idealRotation - this.camRotation;
		diff = normalizeAngle(diff);

		var rotationSpeed = M.max(abs(diff) / M.PI, .01) * M.PI * 2;

		diff = limit(diff, -rotationSpeed * e,rotationSpeed * e);

		this.camRotation += diff;

		this.shakeTime -= e;

		sv();

		if(window.rotation){
			tr(P.w / 2, P.h / 2);
			rotate(this.camRotation);
			tr(-P.w / 2, -P.h / 2);
		}

		tr(-~~this.camX, -~~this.camY);

		fs(road);
		fr(~~this.camX, ~~this.camY, P.w, P.h);

		var sw = 50;

		for(var i in this.textures){
			this.textures[i].render();
		}

		/*for(var i in this.trails){
			this.trails[i].render();
		}*/

		for(var i in this.clients){
			this.clients[i].cycle(e);
		}

		for(var i = this.cars.length - 1 ; i >= 0 ; i--){
			this.cars[i].render();
		}

		for(var i = this.particles.length - 1 ; i >= 0 ; i--){
			this.particles[i].render();
		}

		for(var i in this.buildings){
			this.buildings[i].render();
		}

		this.player.render2();

		rs();

		if(!G.menu){
			this.player.hud.cycle(e);

			if(!this.player.client){
				this.timeleft -= e;
				if(this.timeleft <= 0){
					G.gameOver();
				}
			}
		}

		if(this.player.x < -this.roadSize / 2){
			this.player.explode();
		}
	},
	keyUp: function(k){
		this.down[k] = 0;
		this.evalKeyboardMovement();
	},
	keyDown: function(k){
		this.down[k] = true;
		this.evalKeyboardMovement();
	},
	evalKeyboardMovement: function(){
		this.player.rotationDir = 0;
		this.player.accelerates = false;
		this.player.brakes = false;
		if(this.down[37]){
			this.player.rotationDir = -1;
		}
		if(this.down[39]){
			this.player.rotationDir = 1;
		}
		if(this.down[38]){
			this.player.accelerates = true;
		}
		if(this.down[40]){
			this.player.brakes = true;
		}
		if(this.down[32]){
			G.start();
		}
	},
	addParticle: function(p){
		this.particles.push(p);
	},
	removeParticle: function(p){
		var ind = this.particles.indexOf(p);
		if(ind >= 0) this.particles.splice(ind, 1);
	},
	/*addTrail: function(p){
		this.trails.push(p);
	},
	removeTrail: function(p){
		var ind = this.trails.indexOf(p);
		if(ind >= 0) this.trails.splice(ind, 1);
	},*/
	addBuilding: function(b){
		this.buildings.push(b);
		return b;
	},
	addCar: function(c){
		this.cars.push(c);
		return c;
	},
	removeCar: function(c){
		var i = this.cars.indexOf(c);
		if(i >= 0){
			this.cars.splice(i, 1);
		}
	},
	addClient: function(c){
		this.clients.push(c);
		return c;
	},
	removeClient: function(c){
		var i = this.clients.indexOf(c);
		if(i >= 0) this.clients.splice(i, 1);
	},
	getRandomDestination: function(){
		return rp(this.clientSpots);
	},
	respawnClients: function(){
		var minD = M.max(P.w, P.h);
		var maxD = M.max(P.w, P.h) * 2;

		for(var i = this.clients.length - 1 ; i >= 0 ; i--){
			var client = this.clients[i];
			var d = dist(client.x, client.y, this.camX + P.w / 2, this.camY + P.h / 2);
			if(d > maxD){
				this.clients.splice(i, 1);
			}
		}

		var potential = [];
		for(var i = 0 ; i < this.clientSpots.length ; i++){
			var spot = this.clientSpots[i];
			var d = dist(spot.x, spot.y, this.camX + P.w / 2, this.camY + P.h / 2);
			if(d < maxD && d > minD){
				potential.push(spot);
			}
		}

		var target = 10;
		while(potential.length > 0 && this.clients.length < target){
			var ind = ~~rd(potential.length);
			var spot = potential[ind];
			potential.splice(ind, 1);

			var client = this.addClient(new Client());
			client.x = spot.x;
			client.y = spot.y;
		}
	},
	findClosestClientSpot: function(x, y){
		var spot,
			minDist,
			d,
			closest;
		for(var i = 0 ; i < this.clientSpots.length ; i++){
			spot = this.clientSpots[i];
			d = dist(spot.x, spot.y, x, y);
			if(!closest || d < minDist){
				closest = spot;
				minDist = d;
			}
		}
		return closest;
	},
	shake: function(){
		this.shakeTime = .5;
	}
};

function Menu(){
	this.alpha = 0;
	Easing.tween(this, 'alpha', 0, 1, .5);
}

Menu.prototype = {
	cycle: function(e){
		alpha(this.alpha);
		fs('rgba(0,0,0,.7)');
		fr(0, 0, P.w, P.h);
	}
};

function Home(g){
	Menu.call(this);
}

Home.prototype = xt(Menu.prototype, {
	cycle: function(e){
		Menu.prototype.cycle.call(this, e);

		var t = 'taxi drift',
			w = textWidth(t);
		drawText(c, t, 'white', (P.w - w) / 2, 150, 1, 1);

		t = 'find customers and drive them to their destination';
		w = textWidth(t, .25);
		drawText(c, t, 'white', (P.w - w) / 2, 230, .25, 1);

		t = 'press enter to start';
		w = textWidth(t, .5);
		drawText(c, t, 'white', (P.w - w) / 2, 400, .5, 1);

		t = 'press r to toggle rotation';
		w = textWidth(t, .5);
		drawText(c, t, 'white', (P.w - w) / 2, 450, .5, 1);

		alpha(1);
	},
	keyDown: function(k){
		if(k === 13)
		G.menu = null;
	}
});

function End(s){
	Menu.call(this);
}

End.prototype = xt(Menu.prototype, {
	cycle: function(e){
		Menu.prototype.cycle.call(this, e);

		var t = 'game over',
			w = textWidth(t);
		drawText(c, t, 'white', (P.w - w) / 2, 200, 1, 1);

		var t = 'you served ' + wld.player.dropoffs + ' customers',
			w = textWidth(t, .5);
		drawText(c, t, 'white', (P.w - w) / 2, 350, .5, 1);

		var t = 'and collected $' + wld.player.cash,
			w = textWidth(t, .5);
		drawText(c, t, 'white', (P.w - w) / 2, 400, .5, 1);

		var t = 'press enter to try again',
			w = textWidth(t, .5);
		drawText(c, t, 'white', (P.w - w) / 2, 540, .5, 1);

		alpha(1);
	},
	keyDown: function(k){
		if(k === 13)
		G.restart();
	}
});

function Car(){
	this.l = 50;
	this.w = 30;
	this.x = 0;
	this.y = 0;
	this.rotation = 0;
	this.speed = 0;
	this.rotationSpeed = M.PI;
	this.rotationDir = 0;
	this.vectors = [];
	this.accelerates = false;
	this.brakes = false;
	this.maxSpeed = 500;
	this.drifts = true;

	this.t = 0;

	this.maxAcceleration = 400;
	this.maxDeceleration = 100000;
	this.maxDeceleration = 400;

	this.speedVector = {};

	this.moveAngle = 0;
	this.moveAngleSpeed = M.PI * 1.5;

	this.radius = 10;

	this.carType = rp([
		car.white,
		car.blue,
		car.red,
		car.green,
		car.purple,
		car.gray
	]);
}

Car.prototype = {
	cycle: function(e){
		this.t += e;

		if(this.dead){
			return;
		}

		var oppositeAngle = this.rotation + Math.PI;

		var speedRatio = limit(1 - this.speed / this.maxSpeed, .5, 1);

		var angleDiff = normalizeAngle(this.rotation - this.moveAngle);
		var appliedDiff = limit(angleDiff, -this.moveAngleSpeed * speedRatio * e, this.moveAngleSpeed * speedRatio * e);
		this.moveAngle += this.drifts ? appliedDiff : angleDiff;

		var r = limit(this.speed * 3 / this.maxSpeed, -1, 1);

		this.rotation += this.rotationSpeed * e * this.rotationDir * r;

		this.x += this.speed * M.cos(this.moveAngle) * e;
		this.y += this.speed * M.sin(this.moveAngle) * e;

		var targetSpeed = 0,
			opposite = false;
		if(this.accelerates){
			targetSpeed = this.maxSpeed;
			if(this.speed < 0) opposite = true;
		}else if(this.brakes){
			targetSpeed = -this.maxSpeed / 2;
			if(this.speed > 0) opposite = true;
		}

		var diff = targetSpeed - this.speed;
		var acc = opposite ? this.maxAcceleration * 2 : this.maxAcceleration;
		diff = limit(diff, -e * acc, e * acc);

		this.speed += diff;
		//return;

		//
		//var acceleration = this.accelerates ? this.maxAcceleration : -this.maxDeceleration;
		//this.speed = limit(this.speed + acceleration * e, 0, this.maxSpeed);

		// Turning "opposition"
		var opposition = abs(normalizeAngle(this.rotation - this.moveAngle)) / M.PI;
		this.speed = limit(this.speed - opposition * e * this.maxDeceleration * 2, -this.maxSpeed, this.maxSpeed);
	},
	render: function(){
		sv();
		tr(this.x, this.y);
		rt(this.rotation);

		var img = this.dead ? brokenCar : this.carType;
		di(img, -img.width / 2, -img.height / 2);

		rs();
	},
	explode: function(){
		this.dead = true;

		for(var i = 0 ; i < 40 ; i++){
			var c = rp(['#ff0', '#f00', '#ff8400', '#000'])
			var p = new Particle(5, c);
			p.x = this.x + rd(-5, 5);
			p.y = this.y + rd(-5, 5);
			wld.addParticle(p);

			var a = rd(M.PI * 2),
				d = rd(20, 100),
				t = rd(.5, 1);

			Easing.tween(p, 'x', p.x, p.x + M.cos(a) * d, t);
			Easing.tween(p, 'y', p.y, p.y + M.sin(a) * d, t);
			Easing.tween(p, 'a', 1, 0, t);
			Easing.tween(p, 's', p.s, p.s * rd(5, 10), t, 0, linear, function(){
				wld.removeParticle(p);
			});
		}
	},
	collidesWith: function(c){
		return dist(c.x, c.y, this.x, this.y) < this.radius + c.radius;
	}
};

function Player(){
	Car.call(this);
	this.carType = car.yellow;
	this.client = null;
	this.hud = new HUD();
	this.lastGoodPosition = null;
	this.nextGoodPosition = null;
	this.nextGoodPositionTimer = 0;
	this.cash = 0;
	this.lives = 3;
	this.dropoffs = 0;
}

Player.prototype = xt(Car.prototype, {
	cycle: function(e){
		var tmpX = this.x,
			tmpY = this.y,
			tmpAngle = this.rotation;

		this.noControlTimer -= e;
		if(this.noControlTimer >= 0){
			this.accelerates = false;
			this.rotationDir = 0;
		}

		Car.prototype.cycle.call(this, e);

		if(this.dead) return;

		this.nextGoodPositionTimer -= e;
		if(this.nextGoodPositionTimer <= 0){
			this.lastGoodPosition = this.nextGoodPosition;
			this.nextGoodPosition = { x: this.x, y: this.y };
			this.nextGoodPositionTimer = .1;
		}

		if(this.accelerates && this.speed < 400 || this.brakes && this.speed > -200
			|| abs(this.speed) > 20 && abs(normalizeAngle(this.rotation - this.moveAngle)) > Math.PI / 8){

			var posOnLine = -this.l / 2;

			var p = new Particle(5, '#fff');
			p.x = this.x + M.cos(this.rotation) * posOnLine + rd(-5, 5);
			p.y = this.y + M.sin(this.rotation) * posOnLine + rd(-5, 5);
			wld.addParticle(p);

			var d = 100,
				t = rd(.3, .6),
				a = this.rotation + M.PI + rd(-M.PI / 32, M.PI / 32);

			//Easing.tween(p, 'x', p.x, p.x + M.cos(a) * d, t);
			//Easing.tween(p, 'y', p.y, p.y + M.sin(a) * d, t);
			Easing.tween(p, 'a', 1, 0, t);
			Easing.tween(p, 's', p.s, p.s * rd(5, 10), t, 0, linear, function(){
				wld.removeParticle(this);
			});

			/*var split = 10;
			var t1 = new Trail(
				this.x + M.cos(this.rotation + M.PI / 2) * split,
				this.y + M.sin(this.rotation + M.PI / 2) * split,
				tmpX + M.cos(tmpAngle + M.PI / 2) * split,
				tmpY + M.sin(tmpAngle + M.PI / 2) * split
			);
			wld.addTrail(t1);
			var t2 = new Trail(
				this.x + M.cos(this.rotation - M.PI / 2) * split,
				this.y + M.sin(this.rotation - M.PI / 2) * split,
				tmpX + M.cos(tmpAngle - M.PI / 2) * split,
				tmpY + M.sin(tmpAngle - M.PI / 2) * split
			);
			wld.addTrail(t2);

			Easing.tween(t1, 'a', 1, 0, 1, 2, linear, function(){
				wld.removeTrail(t1);
			});
			Easing.tween(t2, 'a', 1, 0, 1, 2, linear, function(){
				wld.removeTrail(t2);
			});*/
		}

		// Collisions
		var me = this;
		wld.buildings.forEach(function(b){
			if(!me.dead && b.collides && b.contains(me.x, me.y)){
				me.explode();
			}
		});

		wld.cars.forEach(function(c){
			if(!me.dead && c !== me && !c.dead && c.collidesWith(me)){
				me.collided(c);
			}
		});

		// Client
		if(this.client){
			this.clientTimeLeft = M.max(0, this.clientTimeLeft - e);

			var d = dist(this.x, this.y, this.clientSettings.destination.x, this.clientSettings.destination.y);
			if(d < this.clientSettings.radius){
				if(this.speed === 0){
					this.drop();
				}
			}else{
				if(this.clientTimeLeft == 0 && this.speed < 100){
					this.drop();
				}
			}
		}
	},
	render2: function(){
		if(this.clientSettings && !this.dead){
			var r = (this.t % 1) * this.clientSettings.radius;

			alpha(.3);
			c.fillStyle = '#0f0';
			c.lineWidth = 4;
			c.strokeStyle = '#0f0';
			c.beginPath();
			c.arc(this.clientSettings.destination.x, this.clientSettings.destination.y, r, 0, 2 * M.PI, true);
			c.fill();
			c.stroke();
			alpha(1);

			var d = dist(this.x, this.y, this.clientSettings.destination.x, this.clientSettings.destination.y);
			var angle = M.atan2(this.clientSettings.destination.y - this.y, this.clientSettings.destination.x - this.x);
			var arrowDist = limit(d / 10000, 0, 1) * 200 + 100;
			if(d > 300){
				sv();
				tr(this.x + M.cos(angle) * arrowDist, this.y + M.sin(angle) * arrowDist);
				c.rotate(angle);
				di(arrow, -arrow.width / 2, -arrow.height / 2);
				rs();
			}
		}
	},
	pickup: function(c){
		if(!this.client){
			this.client = c;
			this.clientSettings = c.getDestinationSettings();
			this.clientTimeLeft = this.clientSettings.time;
			wld.removeClient(c);
		}
	},
	drop: function(){
		// Drop the client on the side
		this.client.done = true;
		this.client.x = this.x + M.cos(this.rotation + M.PI / 2) * 40;
		this.client.y = this.y + M.sin(this.rotation + M.PI / 2) * 40;
		this.client.findSidewalk();
		wld.addClient(this.client);

		var d = dist(this.x, this.y, this.clientSettings.destination.x, this.clientSettings.destination.y);

		var price = d <= this.clientSettings.radius ? this.clientSettings.price : 0;
		if(price > 0){
			this.hud.message('reward: $' + price);
			this.cash += price;
		}else{
			this.hud.message('too slow');
		}

		this.client = null;
		this.clientSettings = null;

		this.dropoffs++;
	},
	collided: function(c){
		this.explode();
		c.explode();
		wld.removeCar(c);

		window.collider = c;
	},
	explode: function(){
		Car.prototype.explode.call(this);

		this.lives--;
		if(this.lives > 0){
			setTimeout(this.respawn.bind(this), 2000);
		}else{
			// game over
			setTimeout(G.gameOver.bind(G), 2000);
		}

		wld.shake();
	},
	respawn: function(){
		this.hud.message('cars left: ' + this.lives);
		this.client = null;
		this.clientTimeLeft = 0;
		this.clientSettings = null;
		this.dead = false;
		this.x = this.lastGoodPosition.x;
		this.y = this.lastGoodPosition.y;
		this.speed = 0;
	}
});

function Enemy(){
	Car.call(this);

	this.path = null;
	this.maxSpeed = 100;
	this.distanceLeft = 0;
	this.drifts = false;
}

Enemy.prototype = xt(Car.prototype, {
	cycle: function(e){
		this.accelerates = !!this.path;

		var a = M.atan2(wld.player.y - this.y, wld.player.x - this.x);
		var d = dist(wld.player.x, wld.player.y, this.x, this.y);
		if(abs(normalizeAngle(a - this.rotation)) < M.PI / 4 && d < 300){
			this.accelerates = false;
		}

		if(this.path){
			var targetAngle = M.atan2(this.path.y - this.y, this.path.x - this.x);
			var diff = normalizeAngle(targetAngle - this.rotation);
			diff = limit(diff, -this.rotationSpeed * e, this.rotationSpeed * e);

			this.rotation += diff;
			//this.moveAngle = targetAngle;

			if(dist(this.x, this.y, this.path.x, this.path.y) < e * this.speed){
				this.x = this.path.x;
				this.y = this.path.y;

				this.follow(this.path.next);
			}
		}

		Car.prototype.cycle.call(this, e);
	},
	follow: function(p){
		this.path = p;
	}
});

function Client(){
	this.x = this.y = 0;
	this.done = false;
	this.type = rp([clientRed, clientBlue, clientBlack, clientYellow]);
};

Client.prototype = {
	cycle: function(e){
		var d = dist(this.x, this.y, wld.player.x, wld.player.y);

		if(d < 200
			&& !wld.player.dead
			&& wld.player.speed < 100
			&& !this.done
			&& !wld.player.client){

			this.target = null;

			if(d < 30 && wld.player.speed < 50){
				wld.player.pickup(this);
			}else{
				// Approach
				var diff = Math.min(50 * e, d);

				this.x += M.cos(this.angle) * diff;
				this.y += M.sin(this.angle) * diff;
			}
		}else if(!this.target){
			this.findSidewalk();
		}

		if(this.target){
			var d = dist(this.x, this.y, this.target.x, this.target.y);
			var diff = Math.min(50 * e, d);

			if(diff > 0){
				this.angle = M.atan2(this.target.y - this.y, this.target.x - this.x);

				this.x += M.cos(this.angle) * diff;
				this.y += M.sin(this.angle) * diff;
			}
		}else{
			this.angle = M.atan2(wld.player.y - this.y, wld.player.x - this.x);
		}

		var me = this;
		wld.cars.forEach(function(c){
			var d = dist(me.x, me.y, c.x, c.y);
			if(d < 20 && abs(c.speed) > 20){
				me.die();
			}
		});

		this.render();
	},
	render: function(){
		sv();
		tr(this.x, this.y);
		rt(this.angle);
		di(this.type, -this.type.width / 2, -this.type.height / 2);
		rs();
	},
	getDestinationSettings: function(){
		var dest = wld.getRandomDestination();
		var dist = abs(this.x - dest.x) + abs(this.y - dest.y);

		var exigence = ~~rd(1, 4); // 1-3

		var pricePerPx = 1 / 100;
		var perfectTime = dist / wld.player.maxSpeed; // very best possible time
		var reasonableIdealTime = perfectTime * 4;

		var price = ~~((exigence / 3) * pricePerPx * dist);
		var time = (1 - exigence / 4) * reasonableIdealTime;

		return {
			destination: dest,
			exigence: exigence,
			time: time,
			price: M.max(5, price),
			radius: 200
		};
	},
	die: function(){
		wld.removeClient(this);

		for(var i = 0 ; i < 40 ; i++){
			var p = new Particle(4, '#950000', 1);
			var a = rd(M.PI * 2);
			var d = rd(5, 25);
			var t = rd(.05, .2);

			p.x = this.x;
			p.y = this.y;

			wld.addParticle(p);

			Easing.tween(p, 'a', 1, 0, 1, 3, linear, p.remove.bind(p));
			Easing.tween(p, 'x', p.x, p.x + M.cos(a) * d, t);
			Easing.tween(p, 'y', p.y, p.y + M.sin(a) * d, t);
		}

		wld.player.hud.message('don\'t kill customers!')
	},
	findSidewalk: function(){
		var t = wld.findClosestClientSpot(this.x, this.y);

		this.target = {
			x: t.x + rd(-15, 15),
			y: t.y + rd(-15, 15)
		};
	}
};

function HUD(){
	this.msgT = 0;
};

HUD.prototype = {
	cycle: function(e){
		this.msgT -= e;

		var m;
		if(wld.player.dead){
			m = 'wasted';
		}else if(this.msgT > 0){
			m = this.msg;
		}else if(wld.player.client){
			var tl = M.ceil(M.max(0, wld.player.clientTimeLeft));
			m = 'customer time left: ' + tl;
		}else{
			m = 'find a customer'
		}

		var w = textWidth(m, .5);
		var x = (P.w - w) / 2,
			y = P.h / 2 + 200;
		//drawText(c, m, 'black', x, y + 5, .5);
		drawText(c, m, 'white', x, y, .5, 1);

		m = 'cash: $' + wld.player.cash;
		w = textWidth(m, .5)
		drawText(c, m, 'white', P.w - w - 20, 20, .5, 1);


		drawText(c, 'cars: ' + wld.player.lives, 'white', 20, 20, .5, 1);

		if(!wld.player.client){
			m = 'time: ' + ~~(wld.timeleft);
			w = textWidth(m, .5)
			drawText(c, m, 'white', (P.w - w) / 2, 20, .5, 1);
		}
	},
	message: function(m){
		this.msgT = 2;
		this.msg = m.toLowerCase();
	}
}

function Building(x, y, w, h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;

	if(this.w < 0){
		this.x += this.w;
		this.w = -this.w;
	}
		if(this.h < 0){
			this.y += this.h;
			this.h = -this.h;
		}

	this.visible = true;
	this.collides = true;
};

Building.prototype = {
	render: function(){
		if(!this.visible) return;
		if(
			this.x > wld.camX + P.w + P.v
			|| this.y > wld.camY + P.h + P.v
			|| this.x + this.w < wld.camX - P.v
			|| this.y + this.h < wld.camY - P.v){
			return;
		}

		var topLeft1 = { x: this.x, y: this.y };
		var topRight1 = { x: this.x + this.w, y: this.y };
		var bottomRight1 = { x: this.x + this.w, y: this.y + this.h };
		var bottomLeft1 = { x: this.x, y: this.y + this.h };

		var topLeft2 = this.pointUpperPosition(this.x, this.y);
		var topRight2 = this.pointUpperPosition(this.x + this.w, this.y);
		var bottomRight2 = this.pointUpperPosition(this.x + this.w, this.y + this.h);
		var bottomLeft2 = this.pointUpperPosition(this.x, this.y + this.h);

		var windowWidth = 25;

		// Bottom
		//shape([topLeft1, topRight1, bottomRight1, bottomLeft1], 'green');

		// Top
		//shape([topLeft2, topRight2, bottomRight2, bottomLeft2], '#6f6f6f');
		//shape([topLeft2, topRight2, bottomRight2, bottomLeft2], roof);

		var x = topLeft2.x,
			y = topLeft2.y,
			w = bottomRight2.x - topLeft2.x,
			h = bottomRight2.y - topLeft2.y,
			r = 20;
		sv();
		tr(x, y);

		// Border
		fs(roofb);
		fr(0, 0, w, h);

		// Main roof
		fs(roof);
		fr(r, r, w - 2 * r, h - 2 * r);

		rs();

		// Sides
		fs('#00f');

		// Left side
		if(topLeft2.x > topLeft1.x){
			//shape([topLeft1, topLeft2, bottomLeft2, bottomLeft1], '#7e7e7e');
			shape([topLeft1, topLeft2, bottomLeft2, bottomLeft1], side1);

			var windows = this.h / (2 * windowWidth),
				stepZ = .3,
				stepY = this.h / windows;

			for(var z = stepZ / 2 ; z < 1 ; z += stepZ){
				for(var y = this.y + stepY / 2 ; y < this.y + this.h ; y += stepY){
					var lower1 = this.pointUpperPosition(this.x, y - windowWidth / 2, z);
					var upper1 = this.pointUpperPosition(this.x, y - windowWidth / 2, z + stepZ / 2);
					var lower2 = this.pointUpperPosition(this.x, y + windowWidth / 2, z);
					var upper2 = this.pointUpperPosition(this.x, y + windowWidth / 2, z + stepZ / 2);

					shape([lower1, upper1, upper2, lower2], 'black');
				}
			}
		}

		// Right side
		if(topRight2.x < topRight1.x){
			//shape([topRight2, topRight1, bottomRight1, bottomRight2], '#7e7e7e');
			shape([topRight2, topRight1, bottomRight1, bottomRight2], side1);

			var windows = this.h / (2 * windowWidth),
				stepZ = .3,
				stepY = this.h / windows;

			for(var z = stepZ / 2 ; z < 1 ; z += stepZ){
				for(var y = this.y + stepY / 2 ; y < this.y + this.h ; y += stepY){
					var lower1 = this.pointUpperPosition(this.x + this.w, y - windowWidth / 2, z);
					var upper1 = this.pointUpperPosition(this.x + this.w, y - windowWidth / 2, z + stepZ / 2);
					var lower2 = this.pointUpperPosition(this.x + this.w, y + windowWidth / 2, z);
					var upper2 = this.pointUpperPosition(this.x + this.w, y + windowWidth / 2, z + stepZ / 2);

					shape([lower1, upper1, upper2, lower2], 'black');
				}
			}
		}

		// Top side
		if(topLeft2.y > topLeft1.y){
			//shape([topLeft1, topLeft2, topRight2, topRight1], '#999999');
			shape([topLeft1, topLeft2, topRight2, topRight1], side2);

			var windows = this.w / (2 * windowWidth),
				stepZ = .3,
				stepX = this.w / windows;

			for(var z = stepZ / 2 ; z < 1 ; z += stepZ){
				for(var x = this.x + stepX / 2 ; x < this.x + this.w ; x += stepX){
					var lower1 = this.pointUpperPosition(x - windowWidth / 2, this.y, z);
					var upper1 = this.pointUpperPosition(x - windowWidth / 2, this.y, z + stepZ / 2);
					var lower2 = this.pointUpperPosition(x + windowWidth / 2, this.y, z);
					var upper2 = this.pointUpperPosition(x + windowWidth / 2, this.y, z + stepZ / 2);

					shape([lower1, upper1, upper2, lower2], 'black');
				}
			}
		}

		// Bottom side
		if(bottomLeft2.y < bottomLeft1.y){
			//shape([bottomLeft1, bottomLeft2, bottomRight2, bottomRight1], '#999999');
			shape([bottomLeft1, bottomLeft2, bottomRight2, bottomRight1], side2);

			var windows = this.w / (2 * windowWidth),
				stepZ = .3,
				stepX = this.w / windows;

			for(var z = stepZ / 2 ; z < 1 ; z += stepZ){
				for(var x = this.x + stepX / 2 ; x < this.x + this.w ; x += stepX){
					var lower1 = this.pointUpperPosition(x - windowWidth / 2, this.y + this.h, z);
					var upper1 = this.pointUpperPosition(x - windowWidth / 2, this.y + this.h, z + stepZ / 2);
					var lower2 = this.pointUpperPosition(x + windowWidth / 2, this.y + this.h, z);
					var upper2 = this.pointUpperPosition(x + windowWidth / 2, this.y + this.h, z + stepZ / 2);

					shape([lower1, upper1, upper2, lower2], 'black');
				}
			}
		}
	},
	pointUpperPosition: function(x, y, prct){
		if(isNaN(prct)) prct = 1;

		var fromCenterX = x - (wld.camX + P.w / 2);
		var fromCenterY = y - (wld.camY + P.h / 2);

		return {
			x: x + (fromCenterX / P.h) * 200 * prct,
			y: y + (fromCenterY / P.h) * 200 * prct
		};
	},
	contains: function(x, y){
		return x >= this.x - 10
			&& y >= this.y - 10
			&& x <= this.x + this.w + 10
			&& y <= this.y + this.h + 10;
	},
	getCycle: function(){
		var cycle = createCycle(this.getCorners(100));

		var it = rd(8);
		for(var i = 0 ; i < it ; i++){
			cycle = cycle.next;
		}

		return cycle;
	},
	getCorners: function(r){
		return [
			{ x: this.x - r, y: this.y - r },
			{ x: this.x + this.w + r, y: this.y - r },
			{ x: this.x + this.w + r, y: this.y + this.h + r },
			{ x: this.x - r, y: this.y + this.h + r }
		];
	}
};

function Texture(t, x, y, w, h){
	this.t = t;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;

	if(this.w < 0){
		this.x += this.w;
		this.w = -this.w;
	}
	if(this.h < 0){
		this.y += this.h;
		this.h = -this.h;
	}
}

Texture.prototype = {
	render: function(){
		if(
			this.x > wld.camX + P.w + P.v
			|| this.y > wld.camY + P.h + P.v
			|| this.x + this.w < wld.camX - P.v
			|| this.y + this.h < wld.camY - P.v){
			return;
		}

		sv();
		tr(this.x, this.y);
		fs(this.t);
		fr(0, 0, this.w, this.h);
		rs();
	}
};

var defs = {
	a: [
		[1,1,1],
		[1, ,1],
		[1,1,1],
		[1, ,1],
		[1, ,1]
	],
	b: [
		[1,1,1],
		[1, ,1],
		[1,1, ],
		[1, ,1],
		[1,1,1]
	],
	c: [
		[1,1,1],
		[1, , ],
		[1, , ],
		[1, , ],
		[1,1,1]
	],
	d: [
		[1,1,0],
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[1,1,1]
	],
	e: [
		[1,1,1],
		[1, , ],
		[1,1, ],
		[1, , ],
		[1,1,1]
	],
	f: [
		[1,1,1],
		[1, , ],
		[1,1, ],
		[1, , ],
		[1, , ]
	],
	g: [
		[1,1,1],
		[1, , ],
		[1, , ],
		[1, ,1],
		[1,1,1]
	],
	h: [
		[1, ,1],
		[1, ,1],
		[1,1,1],
		[1, ,1],
		[1, ,1]
	],
	i: [
		[1,1,1],
		[ ,1, ],
		[ ,1, ],
		[ ,1, ],
		[1,1,1]
	],
	j: [
		[ , ,1],
		[ , ,1],
		[ , ,1],
		[1, ,1],
		[1,1,1]
	],
	k: [
		[1, ,1],
		[1, ,1],
		[1,1, ],
		[1, ,1],
		[1, ,1]
	],
	l: [
		[1, ,0],
		[1, , ],
		[1, , ],
		[1, , ],
		[1,1,1]
	],
	m: [
		[1, ,1],
		[1,1,1],
		[1, ,1],
		[1, ,1],
		[1, ,1]
	],
	n: [
		[1,1,1],
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[1, ,1]
	],
	o: [
		[1,1,1],
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[1,1,1]
	],
	p: [
		[1,1,1],
		[1, ,1],
		[1,1,1],
		[1, , ],
		[1, , ]
	],
	r: [
		[1,1,1],
		[1, ,1],
		[1,1, ],
		[1, ,1],
		[1, ,1]
	],
	s: [
		[1,1,1],
		[1, , ],
		[1,1,1],
		[ , ,1],
		[1,1,1]
	],
	'$': [
		[ , ,1, ,0],
		[1,1,1,1,1],
		[1, ,1, , ],
		[1,1,1,1,1],
		[ , ,1, ,1],
		[1,1,1,1,1],
		[ , ,1, , ]
	],
	t: [
		[1,1,1],
		[ ,1, ],
		[ ,1, ],
		[ ,1, ],
		[ ,1, ]
	],
	u: [
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[1,1,1]
	],
	v: [
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[ ,1, ]
	],
	w: [
		[1, , , ,1],
		[1, , , ,1],
		[1, ,1, ,1],
		[1, ,1, ,1],
		[ ,1, ,1, ]
	],
	x: [
		[1, ,1],
		[1, ,1],
		[ ,1, ],
		[1, ,1],
		[1, ,1]
	],
	y: [
		[1, ,1],
		[1, ,1],
		[1,1,1],
		[ ,1, ],
		[ ,1, ]
	],
	'\'': [
		[1]
	],
	'.': [
		[0],
		[0],
		[0],
		[0],
		[1]
	],
	' ': [
		[ ,0],
		[ , ],
		[ , ],
		[ , ],
		[ , ]
	],
	'-': [
		[ ,0],
		[ , ],
		[1,1],
		[ , ],
		[ , ]
	],
	':': [
		[0],
		[1],
		[ ],
		[1],
		[ ]
	],
	'?': [
		[1,1,1],
		[ , ,1],
		[ ,1,1],
		[ , , ],
		[ ,1, ]
	],
	'!': [
		[ ,1, ],
		[ ,1, ],
		[ ,1, ],
		[ , , ],
		[ ,1, ]
	],
	'1': [
		[1,1,0],
		[ ,1, ],
		[ ,1, ],
		[ ,1, ],
		[1,1,1]
	],
	'2': [
		[1,1,1],
		[ , ,1],
		[1,1,1],
		[1, , ],
		[1,1,1]
	],
	'3': [
		[1,1,1],
		[ , ,1],
		[ ,1,1],
		[ , ,1],
		[1,1,1]
	],
	'4': [
		[1, ,0],
		[1, , ],
		[1, ,1],
		[1,1,1],
		[ , ,1]
	],
	'5': [
		[1,1,1],
		[1, , ],
		[1,1, ],
		[ , ,1],
		[1,1, ]
	],
	'6': [
		[1,1,1],
		[1, , ],
		[1,1,1],
		[1, ,1],
		[1,1,1]
	],
	'7': [
		[1,1,1],
		[ , ,1],
		[ ,1, ],
		[ ,1, ],
		[ ,1, ]
	],
	'8': [
		[1,1,1],
		[1, ,1],
		[1,1,1],
		[1, ,1],
		[1,1,1]
	],
	'9': [
		[1,1,1],
		[1, ,1],
		[1,1,1],
		[ , ,1],
		[1,1,1]
	],
	'0': [
		[1,1,1],
		[1, ,1],
		[1, ,1],
		[1, ,1],
		[1,1,1]
	]
};

var Font = {};

var createFont = function(color){
	Font[color] = {};

	for(var i in defs){
		var d = defs[i];
		Font[color][i] = cache(d[0].length * 10 + 10, d.length * 10, function(c, r){
			r.fs(color);

			for(var i = 0 ; i < d.length ; i++){
				for(var j = 0 ; j < d[i].length ; j++){
					if(d[i][j]){
						r.fr(j * 10, i * 10, 10, 10);
					}
				}
			}
		});
	}
};

createFont('white');
createFont('black');

var drawText = function(r, t, c, x, y, s, b){
	s = s || 1;

	// Shadow
	if(b) drawText(r, t, 'black', x, y + 5, s, false);

	r.sv();
	r.tr(x, y);
	r.sc(s, s);

	x = 0;
	for(var i = 0 ; i < t.length ; i++){
		var ch = t.charAt(i),
			img = Font[c][ch];
		if(img){
			r.di(img, x, 0);
			x += img.width;
		}
	}
	r.rs();
};

var textWidth = function(t, s){
	var w = 0, i = t.length;
	while(i--){
		var img = Font['white'][t.charAt(i)];
		w += img ? img.width : 0;
	}
	return w * (s || 1);
};

var

s = 4,

car = {
	white: newCar('#fff'),
	broken: newCar('#1b1b1b', true),
	yellow: newCar('#ff0'),
	blue: newCar('#00f'),
	red: newCar('#f00'),
	green: newCar('#0f0'),
	purple: newCar('#f0f'),
	gray: newCar('#6c6c6c'),
},

client = function(color){
	return cache(20, 30, function(c, r){
		r.fs(color);
		//r.beginPath();
		//r.arc(c.width / 2, c.height / 2, 9, 0, M.PI * 2, true);
		//r.fill();

		var w = 14,
			h = 18;
		r.fr((c.width - w)/ 2, (c.height - h) / 2, w, h);

		r.bp();
		r.arc(c.width / 2, c.height / 2 - 10, 4, 0, M.PI * 2, true);
		r.arc(c.width / 2, c.height / 2 + 10, 4, 0, M.PI * 2, true);
		r.fill();

		r.fs('#e99a79');
		r.bp();
		r.arc(c.width / 2, c.height / 2, 6, 0, M.PI * 2, true);
		r.fill();

		r.fs('#000');
		r.fr(c.width / 2 + 2, c.height / 2 - 3, 2, 2);
		r.fr(c.width / 2 + 2, c.height / 2 + 3, 2, -2);
	});
},

clientRed = client('#900'),
clientBlack = client('#000'),
clientBlue = client('#00f'),
clientYellow = client('#880'),

arrow = cache(40, 40, function(c, r){
	with(r){
		tr(c.width / 2, c.height / 2);
		rotate(Math.PI / 2);
		tr(-c.width / 2, -c.height / 2);
		tr(0, c.height);
		sc(1, -1);
		fs('#fff');
		bp();
		mt(20, 40);
		lt(40, 20);
		lt(30, 20);
		lt(30, 0);
		lt(10, 0);
		lt(10, 20);
		lt(0, 20);
		fill();
	}
}),

brokenCar = cache(50, 22, function(c, r){
	with(r){
		fs('#1b1b1b');
		fr(0, 0, 50, 22);

		fs('#000');
		fr(10, 3, 5, 16);
		fr(30, 3, 10, 16);
		fr(15, 1, 7, 1);
		fr(23, 1, 7, 1);
		fr(15, 20, 7, 1);
		fr(23, 20, 7, 1);
	}
}),

grass = cache(200, 200, function(c, r){
	var s = 4;
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			r.fs('rgb(0,' + (128 + ~~rd(-50, 50)) + ', 0)');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

sidewalk = cache(100, 100, function(c, r){
	var b = 8;
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var isBorder = x < b
						|| y < b
						|| x >= c.width - b
						|| y >= c.height - b
						|| x >= c.width / 2 - b && x <= c.width / 2 + b
						|| y >= c.height / 2 - b && y <= c.height / 2 + b;

			var v = (isBorder ? 80 : 100) + ~~rd(-10, 10);


			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

road = cache(200, 200, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var v = 40 + ~~rd(-10, 10);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

water = cache(100, 100, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			r.fs('rgb(0, ' + ~~(168 + ~~rd(-10, 10)) + ', 255)');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

xwalkh = cache(25, 50, function(c, r){
	for(var x = ~~(c.width / 4) ; x < c.width * .75 ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var v = 255 - ~~rd(10, 50);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

xwalkv = cache(50, 25, function(c,r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = ~~(c.height / 4) ; y < c.height * .75 ; y += s){
			var v = 255 - ~~rd(10, 50);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern');

roof = cache(100, 100, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var v = 100 + ~~rd(-10, 10);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

roofb = cache(100, 100, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var v = 50 + ~~rd(-10, 10);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

side1 = cache(100, 100, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var v = 128 + ~~rd(-5, 5);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

side2 = cache(100, 100, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var v = 153 + ~~rd(-5, 5);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

hline = cache(100, 4, function(c, r){
	for(var x = c.width * .25 ; x < c.width * .75 ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var v = 255 - ~~rd(10, 50);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),

vline = cache(4, 100, function(c, r){
	for(var y = c.height * .25 ; y < c.height * .75 ; y += s){
		for(var x = 0 ; x < c.height ; x += s){
			var v = 255 - ~~rd(10, 50);
			r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
			r.fr(x, y, s, s);
		}
	}
}, 'pattern'),


tree = cache(200, 200, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var d = dist(c.width / 2, c.height / 2, x, y);
			var f = d < c.width * .4 && Math.random() < .8;

			if(f){
				var v = 50 + ~~rd(-25, 25);
				r.fs('rgb(0, ' + v + ', 0)');
				r.fr(x, y, s, s);
			}
		}
	}
}),

tree2 = cache(150, 150, function(c, r){
	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var d = dist(c.width / 2, c.height / 2, x, y);
			var f = d < c.width * .4 && Math.random() < .8;

			if(f){
				var v = 50 + ~~rd(-25, 25);
				r.fs('rgb(0, ' + v + ', 0)');
				r.fr(x, y, s, s);
			}
		}
	}
}),

parking = cache(100, 300, function(c, r){
	r.fs(road);
	r.fillRect(0, 0, c.width, c.height);

	for(var x = 0 ; x < c.width ; x += s){
		for(var y = 0 ; y < c.height ; y += s){
			var draw = y < s
					|| y >= c.height - s
					|| (x < s || x >= c.width - s || x >= c.width / 2 - s && x <= c.width / 2 + s) && (y < c.height * .3 || y >= c.height * .7);

			if(draw){
				var v = 255 - ~~rd(10, 50);
				r.fs('rgb(' + v + ', ' + v + ', ' + v + ')');
				r.fr(x, y, s, s);
			}
		}
	}
}, 'pattern')

;

addEventListener('load',function(){
	G = new Game();
});

var tweens = [];

function linear(t, b, c, d){
	return (t / d) * c + b;
};

function easeOutBack(t, b, c, d, s) {
	if (s == undefined) s = 1.70158;
	return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
};

function easeOutBounce(t, b, c, d) {
	if ((t/=d) < (1/2.75)) {
		return c*(7.5625*t*t) + b;
	} else if (t < (2/2.75)) {
		return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
	} else if (t < (2.5/2.75)) {
		return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
	} else {
		return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
	}
};

var Easing = {
	tween: function(o, p, a, b, d, l, f, e){
		tweens.push({
			o: o, // object
			p: p, // property
			a: a, // from
			b: b, // to
			d: d, // duration
			l: l || 0,
			f: f || linear, // easing function
			e: e || noop, // end callback
			t: 0
		});
	},
	cycle: function(e){
		var tw;
		for(var i = tweens.length - 1 ; i >= 0 ; i--){
			tw = tweens[i];
			if(tw.l > 0){
				tw.l -= e;
				tw.o[tw.p] = tw.a;
			}else{
				tw.t = M.min(tw.d, tw.t + e);
				tw.o[tw.p] = tw.f(tw.t, tw.a, tw.b - tw.a, tw.d);
				if(tw.t == tw.d){
					tw.e.call(tw.o);
					tweens.splice(i, 1);
				}
			}
		}
	}
};


function Particle(s, c, a){
	this.s = s;
	this.c = c;
	this.a = a;
};

Particle.prototype = {
	render: function(e){
		alpha(this.a);
		fs(this.c);
		fr(this.x - this.s / 2, this.y - this.s / 2, this.s, this.s);
		alpha(1);
	},
	remove: function(){
		wld.removeParticle(this);
	}
};

function Tree(x, y){
	this.x = x;
	this.y = y;
	this.collides = true;
};

Tree.prototype = xt(Building.prototype, {
	render: function(){
		if(this.x > wld.camX + P.w + 200
			|| this.y > wld.camY + P.h + 200
			|| this.x < wld.camX - 200
			|| this.y < wld.camY - 200){
			return;
		}

		var p1 = this.pointUpperPosition(this.x, this.y, .2);
		var p2 = this.pointUpperPosition(this.x, this.y, .4);

		c.strokeStyle = '#5a3900';
		c.lineWidth = 15;
		bp();
		mt(this.x, this.y);
		lt(p2.x, p2.y);
		stroke();

		di(tree, p1.x - tree.width / 2, p1.y - tree.height / 2);
		di(tree2, p2.x - tree2.width / 2, p2.y - tree2.height / 2);
	},
	contains: function(x, y){
		return abs(x - this.x) < 15
			&& abs(y - this.y) < 15;
	},
	getCycle: function(){
		return null;
	},
	getCorners: function(r){
		return [];
	}
});


