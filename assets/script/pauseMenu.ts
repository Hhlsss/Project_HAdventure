import { _decorator, Button, Component, director, Game, Node } from 'cc';
import { game } from './game';
const { ccclass, property } = _decorator;

@ccclass('pauseMenu')
export class pauseMenu extends Component {
    
    private backGameBtn:Button = null
    private quitGamenBtn:Button = null
    private gameScript:game = null;
    //private btn:Button = null;
    
    
    protected onLoad(): void {
        this.backGameBtn = this.node.getChildByName("backGameBtn").getComponent(Button)
        this.quitGamenBtn = this.node.getChildByName("quitGameBtn").getComponent(Button)
        //this.btn = this.node.getParent().getChildByName("setting").getComponent(Button);

        if(this.backGameBtn && this.quitGamenBtn){
            this.backGameBtn.node.on("click",this.backGameBtnClick,this)
            this.quitGamenBtn.node.on("click",this.quitGameBtnClick,this)
        }

        // if(this.btn){
        //     //this.btn.on("click",this.)
        // }
    
    }

    protected onDestroy(): void {
        if(this.backGameBtn.node!= null){
            this.backGameBtn.node.off("click",this.backGameBtnClick,this)
        }

        if(this.quitGamenBtn.node!= null){
            this.quitGamenBtn.node.off("click",this.quitGameBtnClick,this)
        }
    }
    
    backGameBtnClick(){
        this.gameScript=director.getScene().getChildByName("Canvas").getChildByName("bg").getComponent(game)
        this.gameScript.isGamePause=false
        this.node.active=false
        director.resume();
    }

    quitGameBtnClick(){
        director.end()
    }
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


