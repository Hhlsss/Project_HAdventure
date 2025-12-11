import { _decorator, Button, Collider2D, Component, Contact2DType, director, Input, input, IPhysics2DContact, Label, Node, RigidBody2D, Script } from 'cc';
import { hero } from './hero';
const { ccclass, property } = _decorator;

@ccclass('fire')
export class fire extends Component {
    private rigidBody:RigidBody2D | null=null;
    private Collider:Collider2D = null;
    private LabelNode:Node=null
    private isAroundHero:boolean=false
    private MenuNode:Node = null
    private heroSibling:number=0;
    private isOpenMenu:boolean=false;
    private heroNode:Node=null
    private LvLabel:Label=null
    private SpendLabel:Label=null
    //button
    private BtnFullHp:Button = null;
    private Btn_1:Button = null;
    private Btn_2:Button = null;
    private Btn_3:Button = null;

    protected onLoad(): void {
        this.rigidBody=this.node.getComponent(RigidBody2D)
        this.LabelNode=this.node.getChildByName("remind")
        this.LabelNode.active=false
        this.MenuNode=this.node.getChildByName("menu");
        this.BtnFullHp=this.MenuNode.getChildByName("UI_1").getChildByName("FullHp").getComponent(Button);
        this.Btn_1=this.MenuNode.getChildByName("UI_1").getChildByName("1").getChildByName("Button").getComponent(Button)
        this.Btn_2=this.MenuNode.getChildByName("UI_1").getChildByName("2").getChildByName("Button").getComponent(Button)
        this.Btn_3=this.MenuNode.getChildByName("UI_1").getChildByName("3").getChildByName("Button").getComponent(Button)
        this.LvLabel=this.MenuNode.getChildByName("UI_1").getChildByName("lv").getComponent(Label)
        this.SpendLabel=this.MenuNode.getChildByName("UI_1").getChildByName("spend").getComponent(Label)
        
        // this.BtnFullHp.node.on(Button.EventType.CLICK,this.onBtnFullHp,this)
        // this.Btn_1.node.on(Button.EventType.CLICK,this.onBtn_1,this)
        // this.Btn_2.node.on(Button.EventType.CLICK,this.onBtn_2,this)
        // this.Btn_3.node.on(Button.EventType.CLICK,this.onBtn_3,this)



        if (!this.rigidBody) {
            console.error("角色节点没有挂载 RigidBody2D 组件！");
        }            
            
        this.Collider=this.node.getComponent(Collider2D)//获取相应的属性
        if(this.Collider){
                        // 监听碰撞开始（BEGIN_CONTACT）
                        this.Collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
                        // 监听碰撞持续（STAY_CONTACT）
                        this.Collider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
                        //console.log("开始监听collider2d")
        }
    }

    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            this.heroNode=otherCollider.node;
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.BtnFullHp.node.on(Button.EventType.CLICK,this.onBtnFullHp,this)
            this.Btn_1.node.on(Button.EventType.CLICK,this.onBtn_1,this)
            this.Btn_2.node.on(Button.EventType.CLICK,this.onBtn_2,this)
            this.Btn_3.node.on(Button.EventType.CLICK,this.onBtn_3,this)
            this.updateLvAndSpend();
            this.isAroundHero=true;
            this.LabelNode.active=true
            this.MenuNode.active=false
            this.heroSibling =otherCollider.node.getSiblingIndex();
            //this.node.setSiblingIndex(this.heroSibling+1);
        }
                
    }
        
    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            this.isAroundHero=false;
            this.LabelNode.active=false;
            this.MenuNode.active=false;
            this.node.setSiblingIndex(this.heroSibling-1);
            this.BtnFullHp.node.off(Button.EventType.CLICK,this.onBtnFullHp,this)
            this.Btn_1.node.off(Button.EventType.CLICK,this.onBtn_1,this)
            this.Btn_2.node.off(Button.EventType.CLICK,this.onBtn_2,this)
            this.Btn_3.node.off(Button.EventType.CLICK,this.onBtn_3,this)
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            //console.log("this.isAroundHero="+this.isAroundHero);
        }    
    } 
    
    
     Key_Down(key){
        if(key.keyCode ==69){
            this.KeyDownEvent();
        }
        
    }
    
    private KeyDownEvent(){
        if(this.isAroundHero==true){
            if(this.isOpenMenu==false){
                //this.node.setSiblingIndex(6)
                this.node.setSiblingIndex(this.heroSibling+1);
                this.MenuNode.active=true
                this.isOpenMenu=true;
            }else{
                this.MenuNode.active=false
                this.isOpenMenu=false;
                this.node.setSiblingIndex(this.heroSibling-1);
                //this,this.node.setSiblingIndex(4);
            }
       }
    }
    
    
    protected onDestroy(): void {
        this.Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
                        // 监听碰撞持续（STAY_CONTACT）
        this.Collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        //if(this.BtnFullHp)    this.BtnFullHp.node.off(Button.EventType.CLICK,this.onBtnFullHp,this)
        //if(this.Btn_1)    this.Btn_1.node.off(Button.EventType.CLICK,this.onBtn_1,this)
        //if(this.Btn_2)    this.Btn_2.node.off(Button.EventType.CLICK,this.onBtn_2,this)
        //if(this.Btn_3)    this.Btn_3.node.off(Button.EventType.CLICK,this.onBtn_3,this)
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
    }
    

    private onBtnFullHp(){
        console.log("恢复所有生命值！，存档点");
        director.emit("复活吧！我的爱人！");
        let pos=this.node.getPosition();
        this.heroNode.getComponent(hero).ReSpawnPos=pos;
        director.emit("FullHp")
    }

    private onBtn_1(){
        let lv=this.heroNode.getComponent(hero).Lv
        director.emit("UpMaxHp",lv*3+2)
        this.updateLvAndSpend();
    }

    private onBtn_2(){
        let lv=this.heroNode.getComponent(hero).Lv
        director.emit("UpMaxEndurance",lv*3+2)
        this.updateLvAndSpend();
    }

    private onBtn_3(){
        let lv=this.heroNode.getComponent(hero).Lv
        director.emit("UpMaxHarm",lv*3+2)
        this.updateLvAndSpend();
    }
    
    private updateLvAndSpend(){
        let lv=this.heroNode.getComponent(hero).Lv
        this.LvLabel.string=String(lv)
        this.SpendLabel.string=String(lv*3+2)
    }



    start() {

    }

    update(deltaTime: number) {
        
    }
}


