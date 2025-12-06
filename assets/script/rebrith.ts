import { _decorator, Component, director, instantiate, Node, Prefab } from 'cc';
import { hero } from './hero';
const { ccclass, property } = _decorator;

@ccclass('rebrith')
export class rebrith extends Component {
    
    @property({tooltip:"重生的怪物类型",type:Prefab})
    EnemyPrefab=null
    
    protected onLoad(): void {
        director.on("复活吧！我的爱人！",this.RebirthEnemy,this)
    }

    protected onDestroy(): void {
        director.off("复活吧！我的爱人！",this.RebirthEnemy,this)
    }

    private RebirthEnemy(){
        const EnemyNode = instantiate(this.EnemyPrefab)
        const pos=this.node.getPosition()
        const parent=this.node.getParent();
        EnemyNode.setPosition(pos)
        parent.addChild(EnemyNode)

        this.node.destroy();
    }
    
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


