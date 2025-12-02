import { _decorator, BoxCollider2D, CCInteger, color, Component, director, Font, input, Input, instantiate, Label, math, Node, Prefab, ProgressBar, randomRange, RigidBody2D, Scene, Sprite, tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Woodendummy')
export class Woodendummy extends Component {
    
    
    
    
    
    @property
    (Number)_Enemy_MaxHp:number = null;

    @property
    (Number) maxHp:number = 20;

    @property
    (Font)pixelFont:Font = null;

    @property
    (Prefab) Reward:Prefab = null;

    @property({type:CCInteger,tooltip:"怪物血量",displayName:"怪物的血量"})
    get Enemy_currentHp(){
        return this._Enemy_currentHp
    }
    set Enemy_currentHp(newHp:number){
        if(this._Enemy_currentHp!==newHp){
            const oldNumber = this._Enemy_currentHp
            this._Enemy_currentHp=newHp
        }
        
        if(newHp==0){
            console.log("怪物死亡捏")
            this.dead()
        }
    }





    private HpLabelNode :Node = null;
    private HpLabel=null;
    private _Enemy_currentHp:number = null;
    private Enemy_Hp:Node = null;
    private Enemy_HpProgressBar:ProgressBar = null;
    private UI_2D_Layer=33554432;
    private RewardNode:Node=null
    private parentNode:Node=null

    protected onLoad(): void {

        this._Enemy_MaxHp=this.maxHp;
        this.parentNode=this.node.getParent();
        this.Enemy_currentHp = this._Enemy_MaxHp;
        this.HpLabelNode = this.node.getChildByName("hpLabel");
        this.HpLabel = this.HpLabelNode.getComponent(Label);
        this.Enemy_Hp = this.node.getChildByName("enemy_hp");
        this.Enemy_HpProgressBar = this.Enemy_Hp.getComponent(ProgressBar);  
        this.RewardNode=instantiate(this.Reward) 

        input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
        this.node.on("takeDamage",this.Hp_change,this);
        this.updateHp();
    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
    }
    
    Key_Down(key){
        if(key.keyCode=="51"){
            this.Hp_change(4);
        }else if(key.keyCode=="52"){
            this.Hp_change(-4);

        }
    }


    private updateHp(){
        this.HpLabel.string=String(this._Enemy_currentHp)+"/"+String(this._Enemy_MaxHp);
        this.Enemy_HpProgressBar.progress=this._Enemy_currentHp/this._Enemy_MaxHp;
    }

    public Hp_change(hpChange){
         if(this.Enemy_currentHp-hpChange<=0){
            this.Enemy_currentHp=0;
            this.Hp_Remind(-hpChange)
            this.updateHp(); 
        }else if(this.Enemy_currentHp-hpChange>=this._Enemy_MaxHp){
            this.Enemy_currentHp=this._Enemy_MaxHp;
            this.Hp_Remind(-hpChange)
            this.updateHp();
        }else{
            this.Enemy_currentHp=this.Enemy_currentHp-hpChange;
            this.Hp_Remind(-hpChange)
            this.updateHp();
        }

        this.node_DamageEffect(-hpChange);

    }

    private Hp_Remind(hpChange):void{ //受伤或加血的伤害数字跳动效果
        if(hpChange==0) return;

        const RemindNode = new Node("hpRemindNode");
        const RemindLabel = RemindNode.addComponent(Label);

        this.node.addChild(RemindNode);

        RemindNode.layer=this.UI_2D_Layer;
        //RemindNode.setScale(-1,1);
        RemindLabel.string=String(hpChange)

        //飘血数字的颜色
        RemindLabel.color = hpChange > 0 ? color(117,255,53) : color(255,255,255);
        RemindLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        RemindLabel.verticalAlign = Label.VerticalAlign.CENTER;
        
        const startPosX = randomRange(-150,50);
        const startPosY = randomRange(450,600);

        RemindNode.setPosition(startPosX,startPosY);
        const randomX=randomRange(-360,170);
        const targetPos = new Vec3(randomX,750,0);

        RemindLabel.fontSize = 120;
        RemindLabel.lineHeight = 120;
        RemindLabel.useSystemFont = false;
        RemindLabel.font = this.pixelFont;

        const RemindUIOpacity = RemindLabel.addComponent(UIOpacity);

        tween(RemindUIOpacity)
            .to(1.5,{opacity:50},{easing:'quintOut'})
            .start()
       
        tween(RemindNode).to(1.5,{
            position:targetPos,
        },{
            easing:'quintOut'
        }).call(()=>{
            RemindNode.destroy();
        }).start();
    }

    private node_DamageEffect(hpChange){ //受伤或加血的闪烁效果
    
    
            const mySprite=this.node.getChildByName("enemy_0").getComponent(Sprite);//这里需要改
    
            if(hpChange<0){
    
            tween(mySprite)
                .sequence(
                    tween().to(0.1,{color:color(255,0,0,130)}),
                    tween().to(0.1,{color:color(255,255,255,255)})
                )
                .call(()=>{
                    mySprite.color = color(255,255,255,255);
                })
                .start();
    
            }else if(hpChange>0){
            tween(mySprite)
                .sequence(
                    tween().to(0.1,{color:color(146,255,146,130)}),
                    tween().to(0.1,{color:color(255,255,255,255)})
                )
                .call(()=>{
                    mySprite.color = color(255,255,255,255);
                })
                .start();
            }
            
        }
    
    
    
    private dead(){
        const enemy_UIOpacity=this.node.addComponent(UIOpacity)
        this.scheduleOnce(()=>{
            this.node.getComponent(RigidBody2D).enabled=false
        })
        tween(enemy_UIOpacity)
        .to(0.5,{opacity:0})//,{easing:'quintOut'})
        .call(()=>{
            this.DropItems();
            this.node.destroy();
        })
        .start()
    }

    private DropItems(){
        let i=math.randomRange(0,3)
        i=1
        // while(i){
            const x=randomRange(-10,10)
            const y=randomRange(0,10)
            const pos:Vec3=this.node.getPosition()
            console.log(pos)
            this.RewardNode.setPosition(pos.x,pos.y,0)
            this.parentNode.addChild(this.RewardNode)
            i--;
        // }
    }

    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


