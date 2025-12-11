import { _decorator, AudioSource, Collider2D, Component, Contact2DType, director, IPhysics2DContact, Node, RigidBody2D, tween, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('hpRestore')
export class hpRestore extends Component {

    private rigidBody:RigidBody2D | null=null;
    private Collider:Collider2D = null;
    private IsAdd = false;
    //private _audioSource:AudioSource=null;

    protected onLoad(): void {
            //const audioSource = this.node.getComponent(AudioSource)!;
            //assert(audioSource);
            //this._audioSource = audioSource;
    
            this.rigidBody=this.node.getComponent(RigidBody2D)
            if (!this.rigidBody) {
                console.error("角色节点没有挂载 RigidBody2D 组件！");
            }
    
            this.Collider=this.node.getComponent(Collider2D)//获取相应的属性
            if(this.Collider){
                // 监听碰撞开始（BEGIN_CONTACT）
                this.Collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
                // 监听碰撞持续（STAY_CONTACT）
                //this.player_Collider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
                //console.log("开始监听collider2d")
            }

    }
         
    protected onDestroy(): void {
        if(this.Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);      
            // 监听碰撞结束（END_CONTACT）            
            //this.player_Collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);            
        } 
    }
    
    
    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {   
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            if(this.IsAdd) return;
            
            console.log("碰到血瓶");
            //this._audioSource.play();
            this.IsAdd = true;
                
            director.emit("addHpRestore",1);
                
            //otherCollider.node.emit("addCoins",1)
                
                
            //延迟取消碰撞
            this.scheduleOnce(() => {
                this.Collider.enabled=false
                this.rigidBody.enabled=false
            });
                
                
            //金币消失的动画
            tween(this.node)
            .to(0.1,{scale:new Vec3(0,8)})
            .call(()=>{
                this.node.destroy()
            }).start()


        }
            
    
            
    }
    



    start() {

    }

    update(deltaTime: number) {
        
    }
}


