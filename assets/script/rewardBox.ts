import { _decorator, Collider2D, Component, Contact2DType, Input, input, instantiate, IPhysics2DContact, Label, math, Node, Prefab, random, randomRange } from 'cc';
const { ccclass, property } = _decorator;



@ccclass('rewardBox')
export class rewardBox extends Component {

    
    @property({tooltip:"奖励列表",type:Prefab})
    Rewards=[]

    @property({tooltip:"奖励数量",type:Number})
    RewardsNumber=[]
    
    private collider:Collider2D=null

    private Label:Node =null
    private Sprite_0:Node = null
    private Sprite_1:Node = null

    private playerIsAround:boolean=false;
    private isOPen:boolean=false

    protected onLoad(): void {
        this.initNode();
    }

    protected onDestroy(): void {
        this.collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
        this.collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
    }

    initNode(){
        this.Label=this.node.getChildByName("Label")
        this.collider=this.node.getComponent(Collider2D)
        this.Sprite_0=this.node.getChildByName("宝箱")
        this.Sprite_1=this.node.getChildByName("宝箱打开")
        this.Sprite_0.active=true
        this.Sprite_1.active=false

        this.Label.active=false
        if(this.collider){
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            this.collider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }
    }

    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0 && !this.isOPen){
            this.playerIsAround=true
            this.Label.active=true
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
        }
    }


    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            this.playerIsAround=false
            this.Label.active=false
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        }
    }

   Key_Down(Key){
        if(Key.keyCode==69 && this.playerIsAround==true){
            this.OpenBox()
        }
    }

    OpenBox(){
        if(this.Rewards.length!=this.RewardsNumber.length){
            return
        }else{

            this.Sprite_0.active=false
            this.Sprite_1.active=true
            this.isOPen=true
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)

            var parent=this.node.getParent();
            var pos=this.node.getPosition();
            var i=0

            for(i;i<this.Rewards.length;i++){

                var j=0
                

                for(j;j<this.RewardsNumber[i];j++){
                    var reward=instantiate(this.Rewards[i]);
                    var posX=randomRange(pos.x-20,pos.x+70)
                    var posY=pos.y+100

                    reward.setPosition(posX,posY)

                    parent.addChild(reward);
                }
            }
        }
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


