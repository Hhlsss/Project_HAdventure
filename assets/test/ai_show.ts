import { _decorator, CCInteger, Component, profiler } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StaminaComponent')
export class StaminaComponent extends Component {

  // 将_stamina声明为可监听的属性
  private _stamina: number = 100;
  @property({ group: { name: 'Stamina' }, type: CCInteger, tooltip: '当前耐力值' })
  get stamina(): number {
    return this._stamina;
  }
  set stamina(value: number) {
    let oldValue = this._stamina;
    this._stamina = value;
    // 检查值是否真的改变了
    if (oldValue !== value) {
      this.onStaminaChanged(value, oldValue); // 调用变化处理函数
      this.resetIdleTimer(); // 重置闲置计时器
    }
  }

  @property({ group: { name: 'Stamina' }, tooltip: '耐力耗尽阈值' })
  public exhaustThreshold: number = 0;

  @property({ group: { name: 'Stamina' }, tooltip: '闲置多少秒后开始恢复' })
  public idleRecoverTime: number = 2;

  // 用于存储计时器
  private _idleTimer: number = 0;
  private _isExhausted: boolean = false;

  onStaminaChanged(newVal: number, oldVal: number) {
    console.log(`Stamina changed from ${oldVal} to ${newVal}`);

    // 检查耐力是否为0（或低于阈值）
    if (newVal <= this.exhaustThreshold && !this._isExhausted) {
      this.onStaminaExhausted();
    }
    // 检查耐力是否从耗尽状态恢复
    else if (this._isExhausted && newVal > this.exhaustThreshold) {
      this.onStaminaRecovered();
    }

    // 这里可以添加更新UI的代码，例如更新耐力条图片或文字
    // this.updateStaminaBar(newVal);
  }

  onStaminaExhausted() {
    console.warn("Stamina exhausted!");
    this._isExhausted = true;
    // 触发耐力耗尽的效果，例如：让玩家无法奔跑
    // 例如：this.node.emit('StaminaExhausted');
  }

  onStaminaRecovered() {
    console.log("Stamina recovered from exhausted state.");
    this._isExhausted = false;
    // 恢复玩家的奔跑能力
    // 例如：this.node.emit('StaminaRecovered');
  }

  // 消耗耐力的方法（例如在奔跑时调用）
  consumeStamina(amount: number) {
    if (this._isExhausted) return;
    this.stamina = Math.max(0, this.stamina - amount); // 通过setter赋值以触发监听
  }

  // 恢复耐力的方法
  recoverStamina(amount: number) {
    this.stamina = Math.min(100, this.stamina + amount); // 通过setter赋值以触发监听
  }

  resetIdleTimer() {
    this._idleTimer = 0; // 重置计时器
  }

  update(deltaTime: number) {
    // 如果耐力不为满且未耗尽，则开始计算闲置时间
    if (this.stamina < 100 && !this._isExhausted) {
      this._idleTimer += deltaTime;
      // 如果闲置时间达到设定值，则开始恢复耐力
      if (this._idleTimer >= this.idleRecoverTime) {
        this.recoverStamina(10); // 例如，每次恢复10点
      }
    }
  }
}