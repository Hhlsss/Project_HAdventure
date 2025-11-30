import { _decorator, Component, director, Node, PhysicsSystem } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('game')
export class game extends Component {
    start() {
        // PhysicsSystem.instance.enable=true 
    }

    update(deltaTime: number) {
       
    }
}


