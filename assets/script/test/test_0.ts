import { __private, _decorator, Button, CCInteger, color, Component, director, Input, input, Label, Node, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('test_0')
export class test_0 extends Component {


    private _MyNumber:number = 10;
    private _MaxNumber:number = 10;
    private _isZero:boolean = false;
    private _NumNoChangeTimer:number = 0;

    private colorRed=255;
    private colorGreen=0;
    private colorBlue=0;
    private colorState=0;

    @property//({tooltip:"导入Label"})
    (Label) Label_0:Label = null;
    @property
    (Label) Label_1:Label = null;
    @property
    (ProgressBar) ProgressBar:ProgressBar = null
    @property
    (Button) SceneBtn:Button = null


    @property({  group: {name:"NUM"},type:CCInteger,tooltip:"我需要监测测试的数值！！！" ,displayName:"监听数值"})
    get MyNumber(){
        return this._MyNumber;
    }
    set MyNumber( newNumber:number){
        if(this. _MyNumber !== newNumber){
            const oldNumber = this._MyNumber;
            this._MyNumber = newNumber;
            //数值发生变化！！！！
            this._MyNumberChange(oldNumber,newNumber);
        }
    }

    private _MyNumberChange(oldNumber:number,newNumber:number){
        console.log("数值变化:"+oldNumber+"->"+newNumber);
        if(newNumber==0){
            this._isZero=true;
        }else if(newNumber>0){
            this._isZero=false;
        }else{
            console.log("怎么会小于零呢？？？？")
        }
    }


    private _updateLabel(myLabel:Label,myNumber:number){
        myLabel.string=String(myNumber.toFixed(2))
    }

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
        this.SceneBtn.node.on(Button.EventType.CLICK,this.onSceneBtn,this);

    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        //this.SceneBtn.node.off(Button.EventType.CLICK,this.onSceneBtn,this);
    }

    onSceneBtn(){
        console.log("点击按钮事件");
        director.loadScene("demo_初始场景");
    }

    Key_Down(key){
        //if(key.KeyCode == 65){
            this.MyNumberChange(-1);
        //}
    }

    private MyNumberChange(NumberChange:number){
        if(this.MyNumber+NumberChange<=0){
            this.MyNumber=0;
            console.log("体力耗尽");
            //this._isZero=true;

        }else if(this.MyNumber+NumberChange>=this._MaxNumber){
            this.MyNumber=this._MaxNumber;
            console.log("体力回满");
        
        }else{
            this.MyNumber=this.MyNumber+NumberChange;
        }

        if(NumberChange<0){
            this._NumNoChangeTimer=0;
        }
        this.ProgressBar.progress=this.MyNumber/this._MaxNumber
    }

    private _colorState(Red:number,Green:number,Blue:number,deltaTime:number){
        if(Red==255 && Green==0 && Blue==0){
            this.colorState=0;
        }else if(Red==255 && Green==255 && Blue==0){
            this.colorState=1;
        }else if(Red==0 && Green==255 && Blue==0){
            this.colorState=2;
        }else if(Red==0 && Green==255 && Blue==255){
            this.colorState=3;
        }else if(Red==0 && Green==0 && Blue==255){
            this.colorState=4;
        }else if(Red==255 && Green==0 && Blue==255){
            this.colorState=5;
        }
        switch(this.colorState){
            case 0:
                this.colorChange(this.colorGreen,deltaTime*100)
                this.colorGreen=+deltaTime*1000
                //console.log(this.colorRed,this.colorGreen,this.colorBlue)
                break;
            case 1:
                this.colorChange(this.colorRed,-deltaTime*100)
                break;
            case 2:
                this.colorChange(this.colorBlue,deltaTime*100)
                break;
            case 3:
                this.colorChange(this.colorGreen,-deltaTime*100)
                break;
            case 4:
                this.colorChange(this.colorRed,deltaTime*100)
                break;
            case 5:
                this.colorChange(this.colorBlue,-deltaTime*100)
                break;
        }
        
    }


    
    private colorChange(color:number,change:number){
        if(color+change==255) {color=255; return}
        else if(color+change==0) {color=0;return}

        color=color+change;

    }


    start(){

    }

    update(deltaTime: number) {
        this._updateLabel(this.Label_0,this._MyNumber)
        this.Label_1.string="isZero?:  "+this._isZero;
        this._colorState(this.colorRed,this.colorGreen,this.colorBlue,deltaTime)
        //this.Label_1.color=color(this.colorRed,this.colorGreen,this.colorBlue)
        //console.log(this.colorRed,this.colorGreen,this.colorBlue)








        if(this.MyNumber<this._MaxNumber){
            this._NumNoChangeTimer += deltaTime;
            //console.log(this._NumNoChangeTimer)
        }else if(this.MyNumber==this._MaxNumber){
            this._NumNoChangeTimer = 0;
        }

        if(this._NumNoChangeTimer>=2){
            this.MyNumberChange(deltaTime*0.5)
        }


    }
}


