import { _decorator, Button, Component, director, Input, input, Label, Node, PhysicsSystem } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('game')
export class game extends Component {
    
    public isPlayerGetKey:boolean = false
    public isGamePause:boolean = false
    private pauseNode:Node = null
    private btn:Button = null;
    @property
    (Node) keyItems:Node = null
    
    protected onLoad(): void {
        director.on("isPlayerGetKey",this.playerGetKey,this)
        director.on("end",this.end,this)
        input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
        this.pauseNode = director.getScene().getChildByName("Canvas").getChildByName("ui_hud").getChildByName("uiCamera").getChildByName("pause")
        this.btn = director.getScene().getChildByName("Canvas").getChildByName("ui_hud").getChildByName("uiCamera").getChildByName("setting").getComponent(Button)
        this.pauseNode.active=false;
        this.keyItems.getChildByName("key").active=false
        this.keyItems.getChildByName("get").getComponent(Label).string="未获得"

            console.log(this.btn)
        if(this.btn){
            this.btn.node.on(Button.EventType.CLICK,this.gamePause,this)
            
        }
    }
    
    

    protected onDestroy(): void {
        director.off("isPlayerGetKey",this.playerGetKey,this)
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        director.off("end",this.end,this)
        if(this.btn.node.active==true){
            this.btn.node.off(Button.EventType.CLICK,this.gamePause,this)
        }
    }

    private playerGetKey(is:boolean){
        this.isPlayerGetKey = is
        this.keyItems.getChildByName("key").active=true
        this.keyItems.getChildByName("get").getComponent(Label).string="已获得"
    }

    Key_Down(key){
        if(key.keyCode == 9){
            if(!this.isGamePause){
                this.gamePause();
            }else{
                this.gameResume();
            }
            
        }
    }

    gamePause(){
        console.log("游戏暂停!")
        this.isGamePause=true
        director.pause();
        this.pauseNode.active = true
    }

    gameResume(){
        console.log("游戏继续!")
        this.isGamePause = false 
        director.resume();
        this.pauseNode.active = false
    }

    end(){
        director.loadScene("endScene")
    }

    start() {
        director.emit("UIMessage","欢迎来到《小H的冒险》")
    }

    update(deltaTime: number) {
       
    }
}


