let Game = function() {

    // See the width and height of the screen
    this._width = 1750;
    this._height = 900;

    // Setup the rendering surface
    this.renderer = new PIXI.CanvasRenderer(this._width, this._height);
    document.body.appendChild(this.renderer.view);

    // Create the main stage to draw on
    this.stage = new PIXI.Stage();

    // Setup out physics world simulation
    this.world = new p2.World({
        gravity: [0, 0]
    });

    // Speed parameters for the ship
    this.speed = 100;
    this.turnSpeed = 2;

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
            this.stage.addChild(star);
        }
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
        this.stage.addChild(walls);
    },

    createShip() {  // SHIP

        // Create a new ship object
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
        this.shipShape = new p2.Rectangle(52, 69);
        this.ship.addShape(this.shipShape);
        this.world.addBody(this.ship);

        // Initialise PIXI instance for the ship
        this.shipGraphics = new PIXI.Graphics();

        // Draw triangle to represent ship's body
        this.shipGraphics.beginFill(0x20d3fe);
        this.shipGraphics.moveTo(0, 0);
        this.shipGraphics.lineTo(-26, 60);
        this.shipGraphics.lineTo(26, 60);
        this.shipGraphics.endFill();

        // Draw a square to represent engine
        this.shipGraphics.beginFill(0x1495d1);
        this.shipGraphics.drawRect(-15, 60, 30, 8);
        this.shipGraphics.endFill();

        // position the ship in the middle of the screen
/*
        this.shipGraphics.x = Math.round(this._width / 2);
        this.shipGraphics.y = Math.round(this._height / 2);
*/

        // Add the ship to the stage
        this.stage.addChild(this.shipGraphics);

        // Event listeners for ship
        // this.shipGraphicsEventListeners();
    },

    // shipEventListeners() {
    //     Mousetrap.bind('w', function() {
    //         // this.shipGraphics.rotation = 0; // rotate ship (convert to degrees)
    //         this.moveShip('n');
    //     }.bind(this));
    //     Mousetrap.bind('s', function() {
    //         // this.shipGraphics.rotation = 180 * (Math.PI / 180); // rotate ship (convert to degrees)
    //         this.moveShip('s');
    //     }.bind(this));
    //     Mousetrap.bind('d', function() {
    //         // this.shipGraphics.rotation = 90 * (Math.PI / 180); // rotate ship (convert to degrees)
    //         this.moveShip('e');
    //     }.bind(this));
    //     Mousetrap.bind('a', function() {
    //         // this.shipGraphics.rotation = 270 * (Math.PI / 180); // rotate ship (convert to degrees)
    //         this.moveShip('w');
    //     }.bind(this));
    // },

    // moveShip(direction) { // SHIP MOVEMENT
    //
    //     // Distance to move the ship
    //     const speed = 10;
    //
    //     // Move ship in the desired direction by simply changing it's coordinates by the speed amount
    //     if (direction === 'n')
    //         this.shipGraphics.y -= speed;
    //     if (direction === 'e')
    //         this.shipGraphics.x += speed;
    //     if (direction === 's')
    //         this.shipGraphics.y += speed;
    //     if (direction === 'w')
    //         this.shipGraphics.x -= speed;
    // },

    updatePhysics() { // GAME PHYSICS

        // Move ship by updating position in ship object
        this.shipGraphics.x = this.ship.position[0];
        this.shipGraphics.y = this.ship.position[1];
        this.shipGraphics.rotation = this.ship.angle;

        // Step the physics simulation forward
        this.world.step(1 / 60);
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

