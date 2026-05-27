namespace PIXI {

  class Application {
    ticker: PIXI.Ticker;
  }


  class Ticker {
    add ( fn: (delta: number) => void): void;
    remove ( fn: (delta: number) => void) : void;
  }

  type ColorSource= number;
  type Sprite = {alpha: number};


}


