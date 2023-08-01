import * as THREE from 'three'
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

    const move_speed = 0.05;    
    let canJump = true;
    let score = 0;
    let highscore = 0;
    let frames = 0;
    let spawnRate = 200;
    let hudItems = {
      score: document.getElementById('hud-score'),
      highscore: document.getElementById('hud-highscore'),
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.domElement.id = 'game-canvas';
    document.body.appendChild(renderer.domElement)
  
    const controls = new OrbitControls(camera, renderer.domElement)

    class Box extends THREE.Mesh {
      constructor({ width, height, depth, colour = '#00ff00', velocity = { x: 0, y: 0, z: 0}, position = { x: 0, y: 0, z: 0}, zAcceleration = false}){
        super(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color: colour }))
        this.width = width
        this.height = height
        this.depth = depth
        
        this.position.set(position.x, position.y, position.z)

        this.updateSides();

        this.velocity = velocity
        this.gravity = -0.0008
        this.zAcceleration = zAcceleration;
      }

      updateSides(){
        this.right = this.position.x + (this.width / 2)
        this.left = this.position.x - (this.width / 2)

        this.top = this.position.y + (this.height / 2)
        this.bottom = this.position.y - (this.height / 2)

        this.front = this.position.z + (this.depth / 2)
        this.back = this.position.z - (this.depth / 2)
      }

      update(ground){
        this.updateSides();

        if(this.zAcceleration){
          this.velocity.z += 0.0003;
        }

        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        this.applyGravity(ground);
      }

      applyGravity(ground){
        this.velocity.y += this.gravity;

        if(BoxCollision({ box1: this, box2: ground })){ //if we've collided, or are about to collide with the ground
          const friction = 0.5;
          this.velocity.y *= friction;
          this.velocity.y = this.velocity.y * -1; 
          if(this === cube){
            canJump = true;
          }
        }else{
          this.position.y  += this.velocity.y; //if we're freefalling, update the position
        }
      }
    }

    function GameOver(animationId){
      window.cancelAnimationFrame(animationId); 
      if(score > highscore){ highscore = score;  }
      score = 0;
      alert('u died')      
      Restart()      
    }

    function BoxCollision({ box1, box2 }){
      //detect for collision on x axis
      const zCollision = box1.front >= box2.back && box1.back <= box2.front;
      const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
      const xCollision = box1.right >= box2.left && box1.left <= box2.right;

      return xCollision && yCollision && zCollision;
    }

    function DrawHUD(frames){
      score = frames;
      hudItems.score.innerHTML = frames; 

      if(score > highscore){
        hudItems.highscore.innerHTML = score; 
      } else {
        hudItems.highscore.innerHTML = highscore; 
      }

    }

    function Restart(){
      //set cube position & velocity    
      cube.position.x = 0;
      cube.position.y = 0;
      cube.position.z = 0;
      cube.velocity.x = 0;
      cube.velocity.y = 0;
      cube.velocity.z = 0;

      //un-press keys
      keys.w.pressed = false;
      keys.a.pressed = false;
      keys.s.pressed = false;
      keys.d.pressed = false;
      keys.space.pressed = false;

      //clear enemies
      for(var i = 0; i < enimies.length; i++){
        scene.remove(enimies[i]);
      }

      enimies = [];
      
      frames = 0;

      //resume play
      window.requestAnimationFrame(animate);
    }
  
    const cube = new Box({ width: 1, height: 1, depth: 1, velocity:{ x: 0, y: -0.01, z: 0 }})
    cube.castShadow = true;
    scene.add(cube)

    const ground = new Box({ width: 10, height: 0.5, depth: 50, colour: '#6495ED', position: { x: 0, y: -2, z: 0} })

    ground.receiveShadow = true
    scene.add(ground)

    const light = new THREE.DirectionalLight('0xffffff', 1)
    light.position.y = 3;
    light.position.z = 1;
    light.castShadow = true;
    scene.add(light)

    scene.add(new THREE.AmbientLight('0xffffff', 0.5));

    camera.position.z = 7.96;
    camera.position.x = 2.61;
    camera.position.y = 2.5;
  
    const keys = {
      w: { pressed: false },
      a: { pressed: false },
      s: { pressed: false },
      d: { pressed: false },
      space: { pressed: false },
    }

    window.addEventListener('keydown', (event) =>{
      //console.log(event)
      switch(event.code){
          case 'KeyW':
            keys.w.pressed = true;
          break;
          case 'KeyA':
            keys.a.pressed = true;
          break;
          case 'KeyS':
            keys.s.pressed = true;
          break;
          case 'KeyD':
            keys.d.pressed = true;
          break;
          case 'Space':
            keys.space.pressed = true;
          break;
      }
    })

    window.addEventListener('keyup', (event) =>{
      //console.log(event)
      switch(event.code){
        case 'KeyW':
          keys.w.pressed = false;
        break;
        case 'KeyA':
          keys.a.pressed = false;
        break;
        case 'KeyS':
          keys.s.pressed = false;
        break;
        case 'KeyD':
          keys.d.pressed = false;
        break;
        case 'Space':
          keys.space.pressed = false;
        break;
      }
    })

    let enimies = [ ];

    function animate() {
      const animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera)
      cube.update(ground)

      enimies.forEach(enemy => { 
        enemy.update(ground); 
        if(BoxCollision({ box1: cube, box2: enemy })){ GameOver(animationId) }
      });

      //fall off the edge
      if(cube.position.y < ground.position.y - 2){ GameOver(animationId) }

      cube.velocity.x = 0;
      cube.velocity.z = 0;
      
      if(keys.w.pressed) cube.velocity.z -= move_speed;
      if(keys.a.pressed) cube.velocity.x -= move_speed;
      if(keys.s.pressed) cube.velocity.z += move_speed;
      if(keys.d.pressed) cube.velocity.x += move_speed;
      if(keys.space.pressed && canJump) { cube.velocity.y = move_speed; canJump = false; }
      
      // cube.rotation.x += 0.01
      // cube.rotation.y += 0.01
      // cube.position.y += -0.01
      if(frames % spawnRate === 0){ 
        if(spawnRate > 20){ spawnRate -=20; }

        const enemy = new Box({ width: 1, height: 1, depth: 1, 
          velocity:{ x: 0, y: 0, z: 0.005 }, 
          position: { x: (Math.random() - 0.5) * 10, y: 0, z: -20},
          colour: '#ff0000', 
          zAcceleration: true
        })
        enemy.castShadow = true;
        scene.add(enemy);
        enimies.push(enemy);
      }

      DrawHUD(frames);

      frames++;
    }
    animate()