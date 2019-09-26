// Load the full build.
var _ = require('lodash')

export default class VrPlayer {
  constructor (el, options) {
    const settings = {
      isGyro: false, // 是否开启陀螺仪
      isDragAble: false, // 是否可以拖动场景
      isVideoAutoPlay: false, // 是否自动播放
      isVideoLoop: false, // 是否循环播放
      coverPath: '',
      coverType: 'cover', // 封面类型：cover | vr
      videoPath: '',
      videoType: 'mp4', // 视频类型：mp4 | m3u8
      playButton: undefined, // 播放按钮
      ready: () => {}
    }
    this.el = el
    this.settings = Object.assign(settings, options)
    this.initialize.apply(this)
  }

  // 检查配置
  checkSetting () {
    const utovrSettings = {}
    if (!this.el) {
      console.log('VrPlayer Error：Player must be put in a dom conatiner, such as document.getElementById("myVideo").')
      return false
    } else {
      utovrSettings.container = this.el
      utovrSettings.isGyro = this.settings.isGyro
      utovrSettings.isDragAble = this.settings.isDragAble
      utovrSettings.scenesArr = []
      // 图片场景
      if (this.settings.coverPath !== '' && this.settings.coverType === 'vr') {
        utovrSettings.scenesArr.push({
          sceneId: 'sc',
          sceneName: 'scene_cover',
          sceneFilePath: this.settings.coverPath,
          sceneType: 'Image',
          isVideoAutoPlay: this.settings.isVideoAutoPlay,
          isAutoRotate: false,
          isLittlePlanetEffect: false
        })
      }
      // 视频场景
      let vPath = ''
      if (typeof this.settings.videoPath === 'string') {
        vPath = this.settings.videoPath
      } else {
        vPath = _.values(this.settings.videoPath)[0]
      }
      utovrSettings.scenesArr.push({
        sceneId: 'sv',
        sceneName: 'scene_video',
        sceneFilePath: vPath,
        sceneType: 'Video',
        isVideoAutoPlay: this.settings.isVideoAutoPlay,
        isVideoLoop: this.settings.isVideoLoop,
        isLittlePlanetEffect: false
      })
    }
    return utovrSettings
  }

  // 视频已加载，记录视频时长
  setVideoDuration () {
    const sec = this.playerObj.api_getVideoDom().duration
    this.duration = sec
    if (this.customControlBar) {
      this.customControlBar.setDuration(sec)
    }
    if (this.customProgressBar) {
      this.customProgressBar.setDuration(sec)
    }
  }

  // 自定义播放器样式
  customPlayer () {
    const liveMode = this.settings.videoType === 'm3u8'
    /*
    this.customToolLeft = customToolLeft(this.el, {
      doLike_click: (status) => {
        console.log('doLike_click', status)
      },
      doShare_click: (status) => {
        console.log('doShare_click', status)
      },
      doComment_click: (status) => {
        console.log('doComment_click', status)
      },
      doGyro_click: (status) => {
        console.log('doGyro_click', status)
      }
    })
    */
    this.customControlBar = customControlBar(this.el, {
      doPlay_click: (status) => {
        if (status === 'press') {
          this.playerObj.api_changerSceneById('sv')
          this.playerObj.api_setVideoPlay()
        } else {
          this.playerObj.api_setVideoPause()
        }
        console.log('doPlay_click', status)
      },
      doMore_click: (status) => {
        console.log('doMore_click', status)
      },
      doFullscreen_click: (status) => {
        /*
        const fullscreenEnabled = document.fullscreenEnabled ||
          document.mozFullscreenEnabled || document.webkitFullscreenEnabled
        if (fullscreenEnabled) { // 是否支持全屏
          if (status === 'press') { // 全屏
            this.playerObj.api_enterFullScreen()
          } else {
            this.playerObj.api_exitFullScreen()
          }
        } else {
        */
        if (status === 'press') { // 全屏
          this.el.classList.add('fullscreen')
        } else {
          this.el.classList.remove('fullscreen')
        }
        // }
      },
      doQt_change: (status) => {
        // 切换码率
        if (typeof this.settings.videoPath !== 'string' && this.settings.videoPath[status]) {
          const curTime = this.playerObj.api_getVideoCurTime()
          // const playStatus = this.playerObj.api_getVideoPlayStatus()
          const vPath = this.settings.videoPath[status]
          this.playerObj.api_changeVideoPath(vPath)
          this.playerObj.api_setVideoCurTime(curTime)
        }
        console.log('doQt_change', status)
      },
      qt_status: (typeof this.settings.videoPath === 'string') ? [] : _.keys(this.settings.videoPath)
    })
    this.customPlayButton = customPlayButton(this.el, {
      playButton: this.settings.playButton,
      playButton_click: (status) => {
        if (status === 'press') {
          this.playerObj.api_changerSceneById('sv')
          this.playerObj.api_setVideoPlay()
          this.setVideoDuration()
          // 隐藏封面
          if (this.settings.coverPath !== '' && this.settings.coverType === 'cover') {
            this.customCover.hide()
          }
          if (this.customControlBar) {
            this.customControlBar.show()
            /* utovr的bug，m3u8播放后收不到播放回调，只收到暂停回调 */
            this.customControlBar.switchToPauseIcon()
          }
          if (this.customProgressBar) {
            this.customProgressBar.show()
          }
        }
        console.log('playButton_click', status)
      }
    })
    if (!liveMode) { // 非直播
      this.customProgressBar = customProgressBar(this.el, {
        seekTo: (x, width) => {
          // 视频seek到指定到位置
          this.playerObj.api_setVideoCurTime(x / width * this.duration)
        }
      })
      if (this.settings.coverPath !== '' && this.settings.coverType === 'vr') {
        this.customControlBar.hide() // 隐藏视频进度条，视频尚未加载
        this.customProgressBar.hide()
      } else {
        // 视频已加载，显示视频时长
        this.setVideoDuration()
      }
    }
  }

  // 初始化
  initialize () {
    // 检查配置
    const utovrSettings = this.checkSetting()
    if (!utovrSettings) return
    const startTm = new Date().getTime()

    // 封面
    this.customCover = customCover(this.el, {
      coverPath: this.settings.coverPath,
      coverType: this.settings.coverType
    })
    // 加载中界面
    this.customPreload = customPreload(this.el)
    // 播放器回调处理
    /* utovr的bug，m3u8播放后收不到播放回调，只收到暂停回调 */
    utovrSettings.videoPlayerCallBack = () => {
      console.log('playing', this.playerObj.api_getVideoPlayStatus())
      // if (!this.playerObj.api_getVideoPlayStatus()) return
      this.customPlayButton.switchToPauseIcon()
      this.customControlBar.switchToPauseIcon()
    }
    utovrSettings.videoTogglePlayCallBack = () => {
      console.log('pause', this.playerObj.api_getVideoPlayStatus())
      if (this.playerObj.api_getVideoPlayStatus()) return
      this.customPlayButton.switchToPlayIcon()
      this.customControlBar.switchToPlayIcon()
    }
    utovrSettings.videoPlayEndCallBack = () => {
      console.log('end')
      this.customPlayButton.switchToPlayIcon()
      this.customControlBar.switchToPlayIcon()
    }
    utovrSettings.sceneEventClickCallBack = () => {
      // todo:播放器点击事件 绑定工具栏显示隐藏
      if (window.toggleAll) {
        window.toggleAll()
      }
    }
    utovrSettings.videoLoadProgressCallBack = (e) => {
      if (this.customProgressBar) {
        const videoDom = this.playerObj.api_getVideoDom()
        if (videoDom) {
          const buf = videoDom.buffered
          const leg = buf.length - 1
          if (leg < 0) return
          const t = buf.end(leg).toFixed(1)
          this.customProgressBar.loadProgress(t)
        }
      }
    }
    utovrSettings.videoUpdateCallBack = (e) => {
      const t = this.playerObj.api_getVideoCurTime()
      if (this.customControlBar) {
        this.customControlBar.setCurrentTime(t)
      }
      if (this.customProgressBar) {
        this.customProgressBar.playProgress(t)
      }
    }
    utovrSettings.videoLoadMetaDataCallBack = (e) => {
      console.log('videoLoadMetaDataCallBack', e)
      // 视频已加载，记录视频时长
      this.setVideoDuration()
    }
    loadPlayer(utovrSettings).then((playerObj) => {
      this.playerObj = playerObj
      this.customPlayer() // 添加自定义播放器样式
      playerObj.api_changerSceneByIndex(0)
      playerObj.api_littlePlanet()
      setTimeout(() => {
        // 隐藏loading动画
        this.customPreload.hide()
        // 显示封面
        if (this.settings.coverPath !== '' && this.settings.coverType === 'cover') {
          this.customCover.show()
        }
        this.playerObj.api_normalView()
      }, 1000) // 延时一秒优化小行星效果
      if (typeof this.settings.ready === 'function') {
        this.settings.ready()
      }
      const endTm = new Date().getTime()
      const usedTm = endTm - startTm
      console.log('SDK初始完成回调，用时' + usedTm + 'ms')
    })
  }
}

export { VrPlayer }

function loadPlayer (utovrSettings) {
  return new Promise((resolve, reject) => {
    utovrSettings.initOverCallBack = function () {
      resolve(this)
    }
    if (typeof window.initLoad === 'function') {
      window.initLoad(utovrSettings)
      // console.log(utovrSettings)
    }
  })
}

function customPreload (el) {
  const preDom = document.createElement('div')
  el.appendChild(preDom)
  preDom.id = el.id + '_pre'
  preDom.className = 'vrplayer_pre'
  const o = {}
  o.target = preDom
  o.id = preDom.id
  o.hide = function () {
    const self = this
    self.target.style.display = 'none'
  }
  o.show = function () {
    const self = this
    self.target.style.display = 'block'
  }
  return o
}

function customCover (el, options) {
  if (options.coverPath !== '' && options.coverType === 'cover') {
    const coverDom = document.createElement('div')
    el.appendChild(coverDom)
    coverDom.id = el.id + '_cover'
    coverDom.className = 'vrplayer_pre'
    coverDom.style.backgroundImage = 'url(' + options.coverPath + ')'
    coverDom.style.backgroundRepeat = 'no-repeat'
    coverDom.style.backgroundSize = 'cover'
    coverDom.style.backgroundPosition = '50% 50%'
    coverDom.style.display = 'none'
    coverDom.style.zIndex = '1'
    const o = {}
    o.target = coverDom
    o.id = coverDom.id
    o.hide = function () {
      const self = this
      self.target.style.display = 'none'
    }
    o.show = function () {
      const self = this
      self.target.style.display = 'block'
    }
    return o
  }
}

function customPlayButton (el, options) {
  let btnDom = options.playButton
  if (!btnDom) {
    btnDom = document.createElement('div')
    el.appendChild(btnDom)
    btnDom.id = el.id + '_playButton'
    btnDom.className = 'vrplayer_playButton'
    btnDom.innerHTML += '<div></div>'
  } else {
    if (btnDom.id === '') {
      btnDom.id = btnDom.id = el.id + '_playButton'
    }
  }
  // 点击事件处理
  btnDom.addEventListener(
    'click', function (event) {
      event.stopPropagation()
      const eName = 'playButton_click'
      let status = 'press'
      if (this.classList.contains('press')) {
        status = 'unpress'
        this.classList.remove('press')
      } else {
        this.classList.add('press')
      }
      if (options[eName] && typeof options[eName] === 'function') {
        options[eName](status, event)
      }
    }
  )
  const o = {}
  o.target = btnDom
  o.id = btnDom.id
  o.switchToPlayIcon = function () {
    const self = this
    self.target.classList.remove('press')
  }
  o.switchToPauseIcon = function () {
    const self = this
    self.target.classList.add('press')
  }
  return o
}

function customProgressBar (el, options) {
  const barDom = document.createElement('div')
  el.appendChild(barDom)
  barDom.id = el.id + '_progBar'
  barDom.className = 'vrplayer_progBar'
  const loadedDom = document.createElement('div')
  barDom.appendChild(loadedDom)
  loadedDom.id = el.id + '_progBar_loaded'
  loadedDom.className = 'vrplayer_pb_loaded'
  const bgDom = document.createElement('div')
  barDom.appendChild(bgDom)
  bgDom.id = el.id + '_progBar_bg'
  bgDom.className = 'vrplayer_pb_bg'
  const playedDom = document.createElement('div')
  barDom.appendChild(playedDom)
  playedDom.id = el.id + '_progBar_played'
  playedDom.className = 'vrplayer_pb_played'
  barDom.addEventListener('touchstart', function (e) {
    e.stopPropagation()
    e = (e.changedTouches && e.changedTouches[0]) || e
    const rect = this.getClientRects()[0]
    if (options.seekTo && typeof options.seekTo === 'function') {
      options.seekTo(e.pageX - rect.left, rect.width)
    }
  })
  barDom.addEventListener('mousedown', function (e) {
    e.stopPropagation()
    e = (e.changedTouches && e.changedTouches[0]) || e
    const rect = this.getClientRects()[0]
    if (options.seekTo && typeof options.seekTo === 'function') {
      options.seekTo(e.pageX - rect.left, rect.width)
    }
  })
  const o = {}
  o.target = barDom
  o.id = barDom.id
  o.zeroTime = new Date().setHours(0, 0, 0, 0)
  o.useDoms = []
  o.useDoms.loaded = loadedDom
  o.useDoms.played = playedDom
  o.useDoms.bg = bgDom

  // 加载进度
  o.loadProgress = function (t) {
    const self = this
    if (!self.duration) return
    const w = (t / self.duration * 100).toFixed(1) + '%'
    self.useDoms.loaded.style.width = w
  }
  // 播放进度
  o.playProgress = function (t) {
    const self = this
    if (!self.duration) return
    const w = (t / self.duration * 100).toFixed(1) + '%'
    self.useDoms.played.style.width = w
  }
  o.setDuration = function (sec) {
    const self = this
    self.duration = sec
  }
  o.hide = function () {
    const self = this
    self.target.style.display = 'none'
  }
  o.show = function () {
    const self = this
    self.target.style.display = 'flex'
  }
  return o
}

function customControlBar (el, options) {
  const barDom = document.createElement('div')
  el.appendChild(barDom)
  barDom.id = el.id + '_ctrlBar'
  barDom.className = 'vrplayer_ctrlBar'
  const leftDom = document.createElement('div')
  barDom.appendChild(leftDom)
  const rightDom = document.createElement('div')
  barDom.appendChild(rightDom)
  // 播放、暂停
  leftDom.innerHTML += '<div id="' + barDom.id + '_doPlay" class="vrplayer_cb_doPlay"></div>'
  // 时间
  leftDom.innerHTML += '<div id="' + barDom.id + '_time" class="vrplayer_cb_time">' +
    '<span class="current">00:00</span><span class="sep">/</span><span class="duration">00:00</span></div>'
  // 清晰度
  // console.log(options.qt_status)
  if (options.qt_status.length > 0) {
    const qtDisp = { bq: '标清', gq: '高清', cq: '超清' }
    const item = options.qt_status[0]
    let qtHtml = '<div id="' + barDom.id + '_doQt" class="vrplayer_cb_doQt"><span>' + qtDisp[item] + '</span><div>'
    if (options.qt_status.length > 1) {
      options.qt_status.forEach((item) => {
        qtHtml += '<h3 class="' + item + '">' + qtDisp[item] + '</h3>'
      })
    }
    rightDom.innerHTML = qtHtml + '</div>'
  }
  // rightDom.innerHTML += '<div id="' + barDom.id + '_doQt" class="vrplayer_cb_doQt"><span>标清</span><div>' +
  //   '<h3 class="bq">标清</h3><h3 class="gq">高清</h3><h3 class="cq">超清</h3></div></div>'
  // 全屏
  rightDom.innerHTML += '<div id="' + barDom.id + '_doFullscreen" class="vrplayer_cb_doFullscreen"></div>'
  // 更多
  rightDom.innerHTML += '<div id="' + barDom.id + '_doMore" class="vrplayer_cb_doMore"></div>'
  // 点击事件处理
  document.querySelectorAll('#' + barDom.id + ' > div > div').forEach((item) => {
    item.addEventListener(
      'click', function (event) {
        event.stopPropagation()
        if (this.classList.contains('vrplayer_cb_time')) return // 点击时间不处理
        const eName = this.id.replace(barDom.id + '_', '') + '_click'
        let status = 'press'
        if (this.classList.contains('press')) {
          status = 'unpress'
          this.classList.remove('press')
        } else {
          this.classList.add('press')
        }
        if (options[eName] && typeof options[eName] === 'function') {
          options[eName](status, event)
        }
      }
    )
  })
  document.querySelectorAll('#' + barDom.id + '_doQt h3').forEach((item) => {
    item.addEventListener(
      'click', function (event) {
        if (options.doQt_change && typeof options.doQt_change === 'function') {
          options.doQt_change(item.className)
          document.querySelector('#' + barDom.id + '_doQt > span').innerText = item.innerText
        }
      }
    )
  })
  const o = {}
  o.target = barDom
  o.id = barDom.id
  o.zeroTime = new Date().setHours(0, 0, 0, 0)
  o.useDoms = []
  o.useDoms.playButton = document.querySelector('#' + barDom.id + '_doPlay')
  o.useDoms.current = document.querySelector('#' + barDom.id + ' .current')
  o.useDoms.duration = document.querySelector('#' + barDom.id + ' .duration')

  // 动态设置工具状态
  o.switchToPlayIcon = function () {
    const self = this
    self.useDoms.playButton.classList.remove('press')
  }
  o.switchToPauseIcon = function () {
    const self = this
    self.useDoms.playButton.classList.add('press')
  }
  o.switchQtIconStatus = function (select) {
    // const self = this
    // const iconId = '#' + this.id + '_doQt'
    // document.querySelector(iconId).classList.add('press')
  }
  o.setCurrentTime = function (sec) {
    const self = this
    const dt = new Date(self.zeroTime + sec * 1000)
    if (sec >= 60 * 60) { // >= 1 Hour
      self.useDoms.current.innerText = _.padStart(dt.getHours(), 2, '0') +
       ':' + _.padStart(dt.getMinutes(), 2, '0') + ':' + _.padStart(dt.getSeconds(), 2, '0')
    } else {
      self.useDoms.current.innerText = _.padStart(dt.getMinutes(), 2, '0') + ':' + _.padStart(dt.getSeconds(), 2, '0')
    }
  }
  o.setDuration = function (sec) {
    const self = this
    self.duration = sec
    const dt = new Date(self.zeroTime + sec * 1000)
    if (sec >= 60 * 60) { // >= 1 Hour
      self.useDoms.duration.innerText = _.padStart(dt.getHours(), 2, '0') +
       ':' + _.padStart(dt.getMinutes(), 2, '0') + ':' + _.padStart(dt.getSeconds(), 2, '0')
    } else {
      self.useDoms.duration.innerText = _.padStart(dt.getMinutes(), 2, '0') + ':' + _.padStart(dt.getSeconds(), 2, '0')
    }
  }
  o.hide = function () {
    const self = this
    self.target.style.display = 'none'
  }
  o.show = function () {
    const self = this
    self.target.style.display = 'flex'
  }
  return o
}

/*
function customToolLeft (el, options) {
  const toolDom = document.createElement('div')
  el.appendChild(toolDom)
  toolDom.id = el.id + '_toolLeft'
  toolDom.className = 'vrplayer_toolLeft'
  // 点赞
  toolDom.innerHTML += '<div id="' + toolDom.id + '_doLike" class="vrplayer_tl_doLike"></div>'
  // 分享
  toolDom.innerHTML += '<div id="' + toolDom.id + '_doShare" class="vrplayer_tl_doShare"></div>'
  // 评论
  toolDom.innerHTML += '<div id="' + toolDom.id + '_doComment" class="vrplayer_tl_doComment"></div>'
  // 陀螺仪
  toolDom.innerHTML += '<div id="' + toolDom.id + '_doGyro" class="vrplayer_tl_doGyro"></div>'
  // 点击事件处理
  document.querySelectorAll('#' + toolDom.id + ' > div').forEach((item) => {
    item.addEventListener(
      'click', function (event) {
        const eName = this.id.replace(toolDom.id + '_', '') + '_click'
        let status = 'press'
        if (this.classList.contains('press')) {
          status = 'unpress'
          this.classList.remove('press')
        } else {
          this.classList.add('press')
        }
        if (options[eName] && typeof options[eName] === 'function') {
          options[eName](status, event)
        }
      }
    )
  })
  const o = {}
  o.target = toolDom
  o.id = toolDom.id
  // 动态设置工具状态
  o.switchLikeIconStatus = function (press) {
    const iconId = '#' + this.id + '_doLike'
    if (press === true) {
      document.querySelector(iconId).classList.add('press')
    } else if (press === false) {
      document.querySelector(iconId).classList.remove('press')
    }
  }
  o.switchGyroIconStatus = function (press) {
    const iconId = '#' + this.id + '_doGyro'
    if (press === true) {
      document.querySelector(iconId).classList.add('press')
    } else if (press === false) {
      document.querySelector(iconId).classList.remove('press')
    }
  }
  return o
}

const trigger = (target, eventName) => {
  const event = document.createEvent('Event')
  event.initEvent(eventName, false, false)
  target.dispatchEvent(event)
}
const winHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
const winWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth

*/
