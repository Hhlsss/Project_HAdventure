import { _decorator, Animation, color, Color, Component, director, Label, Node, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('load')
export class load extends Component {
    
    private progressBarNode:ProgressBar = null
    @property
    (Label) progressLabel:Label = null
    @property
    (Label) loadLabel:Label = null
    
    protected onLoad(): void {
        this.progressBarNode = this.node.getChildByName("ProgressBar").getComponent(ProgressBar)
    }
    
    start() {

    }

    update(deltaTime: number) {
        this.progressLabel.string=String((this.progressBarNode.progress*100).toFixed(0))+"%"
        if(this.progressBarNode.progress==1){
            this.loadLabel.getComponent(Animation).stop()
            this.loadLabel.string="Finish！"
            this.loadLabel.color=color(0,255,0)
            this.scheduleOnce(()=>{
                director.loadScene("level_0")
            },1)
        }
    }
}


