const GAME_STATE = {
  // 這邊定義整個遊戲會經歷的狀態，可以想像成遊戲流程中 if else 的流程圖
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardMatchFailed: 'CardMatchFailed',
  CardMatched: 'CardMatchFailed',
  GameFinished: 'GameFinished'
}

const Symbols = [
  // 一副牌 52 張
  // 黑桃(0~12)
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png',
  // 紅心(13~25)
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png',
  // 方塊(26~38)
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png',
  // 梅花(39~51)
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png'

]

const model = {
  revealedCards: [],
  isRevealedCardsMatched () {
    // 相等為 true，不相等為 false
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  triedTimes: 0
}

const view = {
  getCardElement (index) {
    return `<div data-index="${index}" class="card back"></div>`
  },
  getCardContent (index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
        <p>${number}</p>
        <img src=${symbol}>
        <p>${number}</p>
    `
  },
  transformNumber (number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  displayCards (indexes) {
    const cards = document.querySelector('#cards')
    cards.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  flipCards (...cards) {
    // 如果是背面
    // 由於 map 會 return 一個 array，可以考慮用 forEach，或者乾脆 return null
    cards.forEach(card => {
      if (card.classList.contains('back')) {
        // 回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        // 不 return 的話就不會跳出了
        return
      }
      // 如果是正面
      // 回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  pairCards (...cards) {
    cards.forEach(card => {
      card.classList.add('paired')
    })
  },
  renderScore (score) {
    document.querySelector('.score').innerText = `Score: ${score}`
  },
  renderTriedTimes (time) {
    document.querySelector('.tried').innerText = `You've tried: ${time} times`
  },
  appendWrongAnimation (...cards) {
    cards.forEach(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => {
        event.target.classList.remove('wrong')
      }, { once: true })
    })
  },
  showGameFinished () {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

const utility = {
  getRandomNumberArray (count) {
    // Fisher-Yates Shuffle
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      // 分號要加，因為 Math.floor 會跟後面的中括號連起來
      const randomIndex = Math.floor(Math.random() * index + 1);
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards () {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  dispatchCardAction (card) {
    // 當卡片已翻開時，就不做任何動作
    if (!card.classList.contains('back')) {
      return
    }
    // 接著，再判斷目前狀態，執行對應邏輯
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        // 翻開兩張牌，嘗試次數 +1
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        // 如果配對成功，維持翻開並改變樣式
        // 如果配對失敗，翻回兩張卡片
        if (model.isRevealedCardsMatched()) {
          // 改變遊戲狀態為 CardMatched
          this.currentState = GAME_STATE.CardMatched
          // 配對成功，分數 +10 分
          view.renderScore(model.score += 10)
          // 讓卡片在牌桌上維持翻開，改變卡片底色樣式
          view.pairCards(...model.revealedCards)
          // 清空 model 的暫存卡片陣列
          model.revealedCards = []
          // 如果達到 260 分，結束遊戲
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished() // 加在這裡
            return
          }
          // 回復狀態為 FirstCardAwaits
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 改變遊戲狀態為 CardMatchFailed
          this.currentState = GAME_STATE.CardMatchFailed
          // 播放錯誤動畫
          view.appendWrongAnimation(...model.revealedCards)
          // 延遲一秒(=1000ms)，讓使用者記憶卡片
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('current state:', this.currentState)
    console.log('revealed cards', model.revealedCards)
  },
  resetCards () {
    // 翻回卡片
    view.flipCards(...model.revealedCards)
    // 清空 Model 的暫存卡片陣列
    model.revealedCards = []
    // 動作結束後，再把遊戲狀態改成 FirstCardAwaits
    // 這裡如果使用 this，會指到瀏覽器(setTimeout 是瀏覽器提供的 function)
    // 因為我們有把這個函式當作參數傳給 setTimeout
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})
