import { _decorator, Collider2D, Component, Contact2DType, director, Input, input, IPhysics2DContact, Label, Node, RigidBody2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('npc')
export class npc extends Component {

    private rigidBody:RigidBody2D | null=null;
    private player_Collider:Collider2D = null;

    private isAroundHero:boolean=false
    
    // @property
    // (Node)labelRemind:Node=null; //编译器导入文本框的node
    
    private DialogueNode:Node=null;

    //@property


    @property
    (Label)DialogueLabel:Label=null;

    private DialogueCount:number=0;
    
    @property
    (String) Dialoguecontent=[
        "",//占位的一行，没有什么用
        "你好啊",
        "这里是我的测试场景",
        "我只是对话测试的NPC",
        "这是我的最后一句话",
        "再无话说，请速速动手",
    ]

    protected onLoad(): void {

        //input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)

        
        this.rigidBody=this.node.getComponent(RigidBody2D)
         if (!this.rigidBody) {
            console.error("角色节点没有挂载 RigidBody2D 组件！");
        }

        this.player_Collider=this.node.getComponent(Collider2D)//获取相应的属性
            if(this.player_Collider){
                // 监听碰撞开始（BEGIN_CONTACT）
                this.player_Collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
                // 监听碰撞持续（STAY_CONTACT）
                this.player_Collider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
                //console.log("开始监听collider2d")
            }
         
        this.DialogueNode=this.node.getChildByName("DialogueText");
        this.DialogueNode.active=false
    }

    Key_Down(key){
        if(key.keyCode ==69 && this.isAroundHero==true){
            this.DialogueCount++;
            console.log("进入下一行对话"+this.DialogueCount);
            if(this.DialogueCount<this.Dialoguecontent.length){
                this.DialogueLabel.string=this.Dialoguecontent[this.DialogueCount]+"\n按E继续";
            }else{
                input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
                this.DialogueLabel.string=""
            }
            
        }
    }

    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.DialogueNode.active=true
            this.isAroundHero=true;
            console.log("this.isAroundHero="+this.isAroundHero);
        }
        
    }

    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            this.DialogueCount=0;
            this.DialogueLabel.string="按E开始对话";
            this.DialogueNode.active=false
            this.isAroundHero=false;
            console.log("this.isAroundHero="+this.isAroundHero);
        }
    }

    protected onDestroy(): void {

        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        if(this.player_Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.player_Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            // 监听碰撞结束（END_CONTACT）
            this.player_Collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }
    }

    start() {

    }

    update(deltaTime: number) {
      
    }
}


