import { _decorator, Animation, Collider, Collider2D, Component, Contact2DType, director, input, Input, IPhysics2DContact, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('rod')
export class rod extends Component {

    private rob_Collider:Collider2D = null
    private is_down:boolean = false
    private label:Label = null
    private label_Ground:Label = null
    private is_up:boolean=true

    private ground_Collider:Collider2D = null

    protected onLoad(): void {
        this.rob_Collider=this.node.getChildByName("robs").getComponent(Collider2D)
        this.ground_Collider=this.node.getChildByName("ground").getComponents(Collider2D)[1]

        if(this.rob_Collider){
            this.rob_Collider.on(Contact2DType.BEGIN_CONTACT, this.onRob_CollisionOtherEnter, this)
            this.rob_Collider.on(Contact2DType.END_CONTACT, this.onRob_CollisionOtherExit, this)
        
        }

        if(this.ground_Collider){
            this.ground_Collider.on(Contact2DType.BEGIN_CONTACT, this.onGround_CollisionOtherEnter, this)
            this.ground_Collider.on(Contact2DType.END_CONTACT, this.onGround_CollisionOtherExit, this)

        }

        this.label=this.node.getChildByName("robs").getChildByName("Label").getComponent(Label)
        this.label.node.active=false
        this.label_Ground=this.node.getChildByPath("ground/Label").getComponent(Label)
        this.label_Ground.node.active=false
    }

    protected onDestroy(): void {
        if(this.rob_Collider){
            this.rob_Collider.off(Contact2DType.BEGIN_CONTACT, this.onRob_CollisionOtherEnter, this)
            this.rob_Collider.off(Contact2DType.END_CONTACT, this.onRob_CollisionOtherExit, this)
        
        }

        if(this.ground_Collider){
            this.ground_Collider.off(Contact2DType.BEGIN_CONTACT, this.onGround_CollisionOtherEnter, this)
            this.ground_Collider.off(Contact2DType.END_CONTACT, this.onGround_CollisionOtherExit, this)

        }

    }

    private onRob_CollisionOtherEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){ 
        if(otherCollider.tag===0&& this.is_down==false){
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.label.node.active=true
        }
    }

    private onRob_CollisionOtherExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){// && this.is_down==false){
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.label.node.active=false
        }
    }

    private onGround_CollisionOtherEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0 && this.is_down){
            input.on(Input.EventType.KEY_DOWN,this.Key_Down_Ground,this)
            this.label_Ground.node.active=true
            
        }
    }

    private onGround_CollisionOtherExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            input.off(Input.EventType.KEY_DOWN,this.Key_Down_Ground,this)
            this.label_Ground.node.active=false
        }
    }

    Key_Down(key){
        if(key.keyCode==69 && this.is_down==false){
            director.emit("UIMessage","已放下电梯")
            this.is_down=true
            this.is_up=false
            this.node.getChildByPath("robs/rod_down").active=false
            this.node.getChildByPath("robs/rod_up").active=true
            this.node.getChildByName("ground").getComponent(Animation).play("robGround_down")
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            // this.label.string="正在下降"
            // this.schedule(()=>{
            //     this.label.string="下降完成！"
            //     this.schedule(()=>{
            //     this.label.node.active=false
            //     },0.5)
            // },3.3)

            

        }

        // if(key.keyCode==69 && this.is_up==true){
        //     this.is_down=false
        //     this.is_up=true
        //     this.node.getChildByPath("robs/rod_down").active=true
        //     this.node.getChildByPath("robs/rod_up").active=false
        //     this.node.getChildByName("ground").getComponent(Animation).play("robGround_up")
        //     input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        //     this.label.string="正在上升"
        //     this.schedule(()=>{
        //         this.label.string="上升完成！"
        //         this.schedule(()=>{
        //         this.label.node.active=false
        //         },0.5)
        //     },3.3)
        //}
    }


    Key_Down_Ground(key){
        if(key.keyCode==69){
            director.emit("UIMessage","电梯开始上升")
            this.is_down=false
            this.is_up=true
            this.node.getChildByPath("robs/rod_down").active=true
            this.node.getChildByPath("robs/rod_up").active=false
            this.node.getChildByName("ground").getComponent(Animation).play("robGround_up")
            input.off(Input.EventType.KEY_DOWN,this.Key_Down_Ground,this)
            // this.label_Ground.string="正在上升"
            // this.schedule(()=>{
            //     this.label_Ground.string="上升完成！"
            //     this.schedule(()=>{
            //     this.label_Ground.node.active=false
            //     },0.5)
            // },3.3)
        }
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


