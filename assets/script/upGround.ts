import { _decorator, Collider2D, Component, Contact2DType, Input, input, IPhysics2DContact, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('upGround')
export class upGround extends Component {
    
    private collider_wall:Collider2D = null;
    private collider_up:Collider2D = null;
    private isLeaveWall:boolean = false;

    private isPressS:boolean = false
    private isPressSpace:boolean = false

    protected onLoad(): void {
        this.collider_wall = this.node.getComponents(Collider2D)[0]
        this.collider_up = this.node.getComponents(Collider2D)[1]

        if(this.collider_wall){
            this.collider_wall.sensor=false
            // this.collider_wall.on(Contact2DType.BEGIN_CONTACT, this.onCollision_wallOtherEnter, this)
            // this.collider_wall.on(Contact2DType.END_CONTACT, this.onCollision_wallOtherExit, this); 
        }

        if(this.collider_up){
            this.collider_up.sensor=true
            this.collider_up.on(Contact2DType.BEGIN_CONTACT, this.onCollision_upOtherEnter, this)
            this.collider_up.on(Contact2DType.END_CONTACT, this.onCollision_upOtherExit, this); 
        }

    }
    
    protected onDestroy(): void {
        // if(this.collider_wall){
        //     this.collider_wall.off(Contact2DType.BEGIN_CONTACT, this.onCollision_wallOtherEnter, this)
        //     this.collider_wall.off(Contact2DType.END_CONTACT, this.onCollision_wallOtherExit, this); 
        // }

        if(this.collider_up){
            this.collider_up.off(Contact2DType.BEGIN_CONTACT, this.onCollision_upOtherEnter, this)
            this.collider_up.off(Contact2DType.END_CONTACT, this.onCollision_upOtherExit, this); 
        }
        
    }
    
    // private onCollision_wallOtherEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
    //     // if(otherCollider.tag===0){
    //     //     this.isLeaveWall=false
    //     // }
    //     input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
    //     input.on(Input.EventType.KEY_UP,this.Key_Up,this)
    // }

    // private onCollision_wallOtherExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
    //     // if(otherCollider.tag===0){
    //     //     this.isLeaveWall=true
    //     // }
    //     input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
    //     input.off(Input.EventType.KEY_UP,this.Key_Up,this)
    // }

    private onCollision_upOtherEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            console.log("进入可穿透")
            this.collider_wall.enabled=false //不可以踩
            console.log(this.collider_wall.sensor)
        }
    }

    private onCollision_upOtherExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
             console.log("离开可穿透")
            this.collider_wall.enabled=true //可以踩
            console.log(this.collider_wall.sensor)
        }
    }
    
    // Key_Down(key){
    //     if(key.keyCode==32 && this.isPressS){
    //         console.log("允许下降")
    //     }

    //     if(key.keyCode==83){
    //         this.isPressS=true
    //     }

    // }

    // Key_Up(key){
    //     if(key.keyCode==83){
    //         this.isPressS=false
    //     }

    //     if(key.keyCode==32){
    //         this.isPressSpace=false
    //     }
    // }


    start() {

    }

    update(deltaTime: number) {
        //console.log(this.collider_wall.sensor)
    }
}


