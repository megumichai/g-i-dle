import $ from 'jquery'

export function setupCounter(element) {
  const $el = $(element)
  let counter = 0

  const setCounter = (count) => {
    counter = count
    $el.text(`Count is ${counter}`)
  }

  $el.on('click', () => setCounter(counter + 1))
  setCounter(0)
}
