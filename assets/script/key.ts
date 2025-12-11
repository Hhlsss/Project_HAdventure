import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('key')
export class key extends Component {

    start() {
        director.emit("isPlayerGetKey",true)
        director.emit("UIMessage","已获得关键道具:大门钥匙!!")
        this.scheduleOnce(()=>{
            this.node.destroy();
        },2)
    }

    update(deltaTime: number) {
        
    }
}


