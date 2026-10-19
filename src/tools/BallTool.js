// Ball in der Hand (Asien): steht man damit still vor einem Tiger-Schemen im Bambus, wird er neugierig; mit der
// Aktionstaste rollt man ihn gleich hin. Was dann passiert, steuert die Szene (rollBall): der Ball liegt am Boden, man hat
// gleich das Lasso in der Hand, und der Tiger kommt heraus. Den Ball kann man danach noch eine Weile wieder aufheben.

const STILL_TIME = 1.5; // so lange muss man stillstehen, bis der Tiger es bemerkt

export default class BallTool {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.still = 0;
    this.sprite = scene.add.image(0, 0, 'toy_ball').setScale(0.6);
  }

  use() {
    this.scene.rollBall(false);
  }

  update(dt = 0) {
    const p = this.player;
    this.sprite.setPosition(p.x - p.faceX * 10, p.sprite.y - 14 - p.handLift);
    this.sprite.setDepth(p.y + (p.faceY > 0 ? 0.1 : -0.1));
    // stillstehen: der Tiger bemerkt den Ball von selbst
    this.still = p.walkTime ? 0 : this.still + dt;
    if (this.still >= STILL_TIME) {
      this.still = -Infinity; // nur einmal, bis man sich wieder bewegt
      this.scene.rollBall(true);
    }
  }

  // Mit dem Ball fängt man nicht direkt
  caughtBy() {
    return [];
  }

  destroy() {
    this.sprite.destroy();
  }
}
