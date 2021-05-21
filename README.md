# el-resizable(WIP)

# usage
```html
<style>
  #box {
    width: 100px;
    height: 100px;
    margin: 100px auto;
    background: blue;
  }
</style>
<div id="box"></div>
<script src="./el-resizable.js"></script>
<script>
var box = document.getElementById('box');
var styles = window.getComputedStyle(box);
var width = parseInt(styles.getPropertyValue('width'));
var height = parseInt(styles.getPropertyValue('height'));

new Resizable(box, {
  onMove(offset) {
    const { width: w, height: h } = offset;
    Object.assign(box.style, {
      width: w + width + 'px',
      height: h + height + 'px'
    })
  },
  onEnd(offset) {
    const { width: w, height: h } = offset;
    Object.assign(box.style, {
      width: w + width + 'px',
      height: h + height + 'px'
    });

    width += w;
    height += h;
  }
})
</script>
```

# dev
```bash
yarn install

yarn dev
```