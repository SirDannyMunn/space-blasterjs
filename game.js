/* Ideas
*
*  Teleporting portals
*  More points you get faster you can go
*  Additional ships with more points
*  Movement energy runs out
*
*/

let Game = function() {

    // See the width and height of the screen
    this._width = window.innerWidth;
    this._height = window.innerHeight;

    // Setup the background renderer
    this.bgRenderer = new PIXI.CanvasRenderer(this._width, this._height);
    document.body.appendChild(this.bgRenderer.view);

    // Create the background stage to draw on
    this.bgStage = new PIXI.Stage();

    // Setup the rendering surface
    this.renderer = new PIXI.CanvasRenderer(this._width, this._height, {transparent:true}); // Set to transparent
    document.body.appendChild(this.renderer.view);

    // Create the main stage to draw on
    this.stage = new PIXI.Stage();

    // Setup out physics world simulation
    this.world = new p2.World({
        gravity: [0, 0]
    });

    // Speed parameters for the ship
    this.speed = 250;
    this.turnSpeed = 10;

    // Speed parameters for bullets
    this.bulletSpeed = 2000;
    this.fired = false;

    // Setup keyboard event listeners
    window.addEventListener('keydown', function (event) {
        this.handleKeys(event.keyCode, true);
    }.bind(this), false);
    window.addEventListener('keyup', function (event) {
        this.handleKeys(event.keyCode, false);
    }.bind(this), false);
    // Setup mouse event listeners
    window.addEventListener('mousemove', function(event) {
        this.handleMouseMove(event);
    }.bind(this));
    window.addEventListener('click', function(event) {
        this.handleMouseClick(event);
    }.bind(this));

    // Initialise enemy arrays
    this.enemyBodies = [];
    this.enemyGraphics = [];
    this.removeObjs = [];

    // Initialise bullets
    this.bulletBodies = [];
    this.bulletGraphics = [];

    // Start running the Game
    this.build();
};

Game.prototype = {

    /*
    * Build the scene and begin animating
    */
    build() {

        // Draw the background stars
        this.drawStars();

        // Setup the boundaries of the Game's arena
        this.setupBoundaries();

        // Draw the ship to the scene
        this.createShip();

        // Create random enemies
        this.createEnemies();

        // Begin the first frame
        requestAnimationFrame(this.tick.bind(this));
    },

    /*
    * Draw the field of stars behind all of the action
    */
    drawStars() { // STARS

        /*
        * Draw randomly positioned stars
        */
        for (let i=1; i<1500; i++) {

            // Generate random parameters for the stars
            let x = Math.round(Math.random() * this._width);
            let y = Math.round(Math.random() * this._height);
            let rad = Math.ceil(Math.random() * 2);
            let alpha = Math.min(Math.random() + 0.25, 1);

            // Draw this star
            let star = new PIXI.Graphics();
            star.beginFill(0xFFFFFF, alpha);
            star.drawCircle(x, y, rad);
            star.endFill();

            // Attach the star to the stage
            this.bgStage.addChild(star);
        }

        this.bgRenderer.render(this.bgStage)
    },

    /*
    * Draw the boundaries of the space arena
    */
    setupBoundaries() { // GAME BOUNDARIES

        // Configure the walls for the Game
        let walls = new PIXI.Graphics();
        walls.beginFill(0xFFFFFF, 0.5);
        walls.drawRect(0, 0, this._width, 10);
        walls.drawRect(this._width-10, 10, 10, this._height-20);
        walls.drawRect(0, this._height-10, this._width, 10);
        walls.drawRect(0, 10, 10, this._height-20);

        // Attach the walls to the stage
        this.bgStage.addChild(walls);

        this.bgRenderer.render(this.bgStage)
    },

    /*
    * Create the ship to use in the game
    */
    createShip() {  // SHIP

        // Physics for the ship object
        this.ship = new p2.Body({
            mass: 1,
            angularVelocity: 0,
            damping: 0,
            angularDamping: 0,
            position: [
                Math.round(this._width / 2),
                Math.round(this._height / 2)
            ]
        });
        this.shipShape = new p2.Circle(52, 69);
        this.ship.addShape(this.shipShape);
        this.world.addBody(this.ship);

        // Draw triangle to represent ship's body
        let shipGraphics = new PIXI.Graphics();
        shipGraphics.beginFill(0x20d3fe);
        shipGraphics.moveTo(0, 0);
        shipGraphics.lineTo(-26, 80);
        shipGraphics.lineTo(26, 80);
        shipGraphics.endFill();

        // Draw a square to represent engine
        shipGraphics.beginFill(0x1495d1);
        shipGraphics.drawRect(-15, 60, 38, 8);
        shipGraphics.endFill();

        // Cache the ship to only use one draw cycle per tick
        let shipCache = new PIXI.CanvasRenderer({width: 52, height: 69, transparent:false, backgroundColor: 0x38d41a});
        let shipCacheStage = new PIXI.Stage();
        shipCacheStage.addChild(shipGraphics);
        shipCache.render(shipCacheStage);
        shipCache.view.setAttribute('style', 'padding: 500px;');
        let shipTexture = PIXI.Texture.fromCanvas(shipCache.view);
        this.shipGraphics = new PIXI.Sprite(shipTexture);

        // Add the ship to the stage
        this.stage.addChild(this.shipGraphics);
    },

    /*
    * Handle mouse movements
    */
    handleMouseMove(event) {
        const cx = this.ship.position[0];
        const cy = this.ship.position[1];
        const x2 = event.clientX;
        const y2 = event.clientY;
        const deltaX = x2 - cx;
        const deltaY = y2 - cy;

        const degrees = Math.atan2(deltaY, deltaX); // In radians

        this.ship.angle = degrees + Math.PI / 2;
    },

    /*
    * Create enemies to fight against
    */
    createEnemies() {

        // Create random interval to generate new enemies
        this.enemyTimer = setInterval(function () {

            // Random physics properties for enemy ships
            const x = Math.round(Math.random() * this._width);
            const y = Math.round(Math.random() * this._height);
            const vx = (Math.random() - 0.5) * this.speed / 2;
            const vy = (Math.random() - 0.5) * this.speed / 2;
            const va = (Math.random() - 0.5) * this.speed / 2;

            // Create the enemies physics body
            let enemy = new p2.Body({
                position: [x, y],
                mass: 0.5,
                damping: 0,
                angularDamping: 0,
                velocity: [vx, vy],
                angularVelocity: va
            });

            let enemyShape = new p2.Circle(20);
            enemyShape.sensor = true;
            enemy.addShape(enemyShape);
            this.world.addBody(enemy);

            // Create the enemy objects graphics
            let enemyGraphics = new PIXI.Graphics();
            enemyGraphics.beginFill(0x38d41a);
            enemyGraphics.drawCircle(0, 0, 20);
            enemyGraphics.endFill();
            enemyGraphics.beginFill(0x2aff00);
            enemyGraphics.lineStyle(1, 0x239d0b, 1);
            enemyGraphics.drawCircle(0, 0, 10);
            enemyGraphics.endFill();

            this.stage.addChild(enemyGraphics);

            // Store enemies in variable to keep track of them
            this.enemyBodies.push(enemy);
            this.enemyGraphics.push(enemyGraphics);
        }.bind(this), 1000);

        this.world.on('beginContact', function(event) {
            // console.log(event);
            if (event.bodyB.id === this.ship.id) {
                this.removeObjs.push(event.bodyA);
            }
        }.bind(this));
    },

    /*
    * Create bullets for shooting
    */
    createBullet() {

        // Bullet coordinates
        const angle = this.ship.angle + Math.PI / 2;
        this.shipAngle = this.ship.angle % (2*Math.PI);
        const x = this.ship.position[0] + (35 * Math.sin(this.shipAngle));
        const y = this.ship.position[1] + (- 35 * Math.cos(this.shipAngle));

        let bullet = new p2.Body({
            position: [x, y],
            mass: 0.01,
            angle: angle,
            damping: 0,
            angularDamping: 0,
            force: [
                - this.bulletSpeed * Math.cos(angle),
                - this.bulletSpeed * Math.sin(angle),
            ],
        });

        const bulletShape = new p2.Box(1, 5);
        bullet.addShape(bulletShape);
        this.world.addBody(bullet);

        let bulletGraphics = new PIXI.Graphics();
        bulletGraphics.beginFill(0x38d41a);
        bulletGraphics.drawRect(0, 0, 4, 15);
        bulletGraphics.endFill();
        bulletGraphics.rotation = this.shipAngle;

        this.stage.addChild(bulletGraphics);

        // Store bullets in an array to keep track of them
        this.bulletBodies.push(bullet);
        this.bulletGraphics.push(bulletGraphics);
    },

    /*
    * Handle keyboard input from event listeners
    */
    handleKeys(keyCode, state) {

        // Decipher the keycode to an action
        switch (keyCode) {
            case 65: // A
                this.keyLeft = state;
                break;
            case 68: // D
                this.keyRight = state;
                break;
            case 87: // W
                this.keyUp = state;
                break;
            case 83: // S
                this.keyDown = state;
                break;
        }
    },

    handleMouseClick() {
        this.createBullet();
    },

    /*
    * Update physics to keep realtime
    */
    updatePhysics() { // GAME PHYSICS

        const angle = Math.PI / 2;
        const directionSpeed = this.speed * Math.sin(angle);

        // Move the ship by updating the "force vector" in the ship's physics object
        if (this.keyLeft) {
            this.ship.force[0] -= directionSpeed;
        }
        if (this.keyRight) {
            this.ship.force[0] += directionSpeed;
        }
        if (this.keyUp) {
            this.ship.force[1] -= directionSpeed;
        }
        if (this.keyDown) {
            this.ship.force[1] += directionSpeed;
        }

        // Move ship graphic by updating it's coordinates to the position in the ship object
        this.shipGraphics.x = this.ship.position[0];
        this.shipGraphics.y = this.ship.position[1];
        this.shipGraphics.rotation = this.ship.angle;

        // Boundaries teleporting
        if (this.ship.position[0] > this._width)
            this.ship.position[0] = 0;
        if (this.ship.position[0] < 0)
            this.ship.position[0] = this._width;
        if (this.ship.position[1] > this._height)
            this.ship.position[1] = 0;
        if (this.ship.position[1] < 0)
            this.ship.position[1] = this._height;

        // Update all of the enemy graphics objects' position
        for (let i=0; i<this.enemyBodies.length; i++) {
            this.enemyGraphics[i].x = this.enemyBodies[i].position[0];
            this.enemyGraphics[i].y = this.enemyBodies[i].position[1];
        }

        // Update all of the bullet bodies position
        for (let i=0; i<this.bulletBodies.length; i++) {
            this.bulletGraphics[i].x = this.bulletBodies[i].position[0];
            this.bulletGraphics[i].y = this.bulletBodies[i].position[1];
        }

        // Step the physics simulation forward
        this.world.step(1 / 60);

        // Remove all objects from remove objects array
        for (let i=0; i<this.removeObjs.length; i++) {
            this.world.removeBody(this.removeObjs[i]);

            // Remove element from screen and arrays
            let index = this.enemyBodies.indexOf(this.removeObjs[i]);
            if (index) {
                this.enemyBodies.splice(index, 1);
                this.stage.removeChild(this.enemyGraphics[index]);
                this.enemyGraphics.splice(index, 1);
            }
        }

        this.removeObjs.length = 0;
    },

    /*
    * Fires at the end of a gameloop to reset and redraw the canvas
    */
    tick() {

        // Update the physics
        this.updatePhysics();

        // Render the stage for the current frame
        this.renderer.render(this.stage);

        // Begin the next frame
        requestAnimationFrame(this.tick.bind(this));
    }
};

