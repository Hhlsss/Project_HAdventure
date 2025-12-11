import { _decorator, Component, director, Label, Node, tween, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('mainMenu')
export class mainMenu extends Component {

    private startBtn:Node = null
    private quitBtn:Node = null

    private bg_sky:Node = null
    private bg_ground:Node = null
    private bg_hill:Node = null
    private bg_hill_1:Node = null

    private labelVersion:Node = null
    private isStart:boolean = true


    protected onLoad(): void {
        this.startBtn=this.node.getChildByName("start")
        this.quitBtn=this.node.getChildByName("quit")


        if(this.startBtn && this.quitBtn){
            this.startBtn.on("click",this.startBtnClick,this)
            this.quitBtn.on("click",this.quitBtnClick,this)
        }

        this.bg_sky = this.node.getChildByName("bg").getChildByName("bg_sky")
        this.bg_ground = this.node.getChildByName("bg").getChildByName("bg_ground")
        this.bg_hill = this.node.getChildByName("bg").getChildByName("bg_hill")
        this.bg_hill_1 = this.node.getChildByName("bg").getChildByName("bg_hill_1")

        this.labelVersion = this.node.getChildByName("version")
        
        //this.labelVersion.setScale(100,100)
        this.node.getChildByName("title").setScale(100,100)
        tween(this.node.getChildByName("title"))
        .to(1.5,{scale:new Vec3(1,1,1)})
        .start()




        //this.isStart=false
        // tween(this.labelVersion)
        // .to(0.5,{scale:new Vec3(1,1,1)})
        // .start()

        // tween(this.labelVersion)
        // .to(0.5,{scale:new Vec3(1,1,1)})
        // .call(()=>{
        //         //this.isStart=true
        // })
        // .start()    
           
    }

    protected onDestroy(): void {
        // if(this.startBtn){
        //     this.startBtn.off("click",this.startBtnClick,this)
        // }
        // if(this.quitBtn){
        //     this.quitBtn.off("click",this.quitBtnClick,this)
        // }
    }

    startBtnClick(){
        director.loadScene("loadScene");
    }

    quitBtnClick(){
        director.end();
    }

    private VersionLabelChange(){

        if(this.isStart){
            console.log("start")
            this.isStart=false
            tween(this.labelVersion)
            .to(0.5,{scale:new Vec3(0.5,0.5,1)})
            .start()

            tween(this.labelVersion)
            .to(0.5,{scale:new Vec3(1,1,1)})
            // .call(()=>{
                
            // })
            .start()
            this.isStart=true
        }
        
    }

    start() {

    }

    update(deltaTime: number) {

        this.VersionLabelChange();

        var pos_sky:Vec3 = this.bg_sky.getPosition();
        var pos_groud:Vec3 = this.bg_ground.getPosition();
        var pos_hill:Vec3 = this.bg_hill.getPosition();
        var pos_hill_1:Vec3 = this.bg_hill_1.getPosition();

        this.bg_sky.setPosition(pos_sky.x-deltaTime*100,pos_sky.y)
        this.bg_ground.setPosition(pos_groud.x-deltaTime*300,pos_groud.y)
        this.bg_hill.setPosition(pos_hill.x-deltaTime*200,pos_hill.y)
        this.bg_hill_1.setPosition(pos_hill_1.x-deltaTime*250,pos_hill_1.y)

        if(pos_sky.x<-2000){
            this.bg_sky.setPosition(2000,pos_sky.y)
        }

        if(pos_groud.x<-1500){
            this.bg_ground.setPosition(1500,pos_groud.y)
        }

        if(this.bg_hill.x<-1500){
            this.bg_hill.setPosition(1600,pos_hill.y)
        }

        if(this.bg_hill_1.x<-1700){
            this.bg_hill_1.setPosition(200,pos_hill_1.y)
        }

    }
}


