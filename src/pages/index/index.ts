import { Markers, Result } from '../../api/interfaces'
import { getMarkers, getUserInfo } from '../../api/api'

import { rpx2px } from '../../utils/utils'

const EVENT_TAP_SEARCH = 0
const EVENT_TAP_SHOW_CURRENT_LOCATION = 1

let app = getApp()
let indexPage
let mapCtx
let windowWidth
let windowHeight

// 每一公里所跨越的经纬度
const KILOMETER_LAT = 0.0019
const KILOMETER_LNG = 0.0017

Page({
  data: {
    longitude: 121.438378,
    latitude: 31.181471,
    markers: [],
  },

  onLoad: function(): void {
    indexPage = this

    // 使用 wx.createMapContext 获取 map 上下文 
    mapCtx = wx.createMapContext('homeMap')

    // 获取屏幕宽高
    app.getSystemInfo((systemInfo: WeApp.SystemInfo) => {
        windowWidth = systemInfo.windowWidth
        windowHeight = systemInfo.windowHeight
        indexPage.setUpIconOnmap()
    })
  },

  onShow: function(): void {
    // 获取定位
    app.getLocationInfo((locationInfo: WeApp.LocationInfo) => {
        indexPage.setData({
          longitude: locationInfo.longitude,
          latitude: locationInfo.latitude,
        })

        getMarkers(
          (markers: Array<Markers>) => {
            const mergedMarkers = indexPage.mergeMarkers(markers)
            const transformedMarkers = indexPage.transformMarkers(mergedMarkers)
            indexPage.setData({
              markers: transformedMarkers,
            })
          },
        ) 
    })
  },

  controltap: (event) => {
    switch (event.controlId) {
      // case EVENT_TAP_SEARCH:
      //   wx.navigateTo({
      //     url: '../search/search',
      //   })
      //   break
      case EVENT_TAP_SHOW_CURRENT_LOCATION:
        mapCtx.moveToLocation()
        break
      default:
    }
  },

  markertap: (event) => {
    if (event && event.markerId) {
      const marker = indexPage.findMarker(event.markerId) as Markers
      if (marker.isMergeMarker) {
        wx.navigateTo({
          url: 'mapdetail?users=' + marker.children
        })
      } else {
        wx.navigateTo({
            url: '../homepage/homepage2?user=' + event.markerId,
        })
      }
    }
  },

  findMarker: (id: string) => {
    if (indexPage.data.markers) {
      return indexPage.data.markers.find((marker) => (marker.id + '') === id)
    }
    return { markerId: id }
  },

  onRegionChange: (e) => {
    console.log(e)
    mapCtx.getCenterLocation({
      success: (res) => {
        console.log(res)
      },
    })
  },

  onMapTap: (e) => {
    console.log(e)
  },

  onShareAppMessage: () => {
    return {
      title: '有读书房',
      path: 'pages/index/index',
    }
  },

  setUpIconOnmap: () => {
    // // Homepage icon:
    // let width = windowWidth * 0.15
    // let height = width
    // let left = windowWidth * 0.95 - width
    // let top = windowHeight * 0.05

    // Show current location icon:
    let cWidth = windowWidth * 0.1
    let cHeight = cWidth
    let cLeft = windowWidth * 0.97 - cWidth
    let cTop = windowHeight * 0.92 - cHeight

    indexPage.setData({
      controls: [
        // 搜索按钮
        // {
        //   id: EVENT_TAP_SEARCH,
        //   iconPath: '/resources/img/icon_search.png',
        //   position: {
        //     left: left,
        //     top: top,
        //     width: width,
        //     height: height,
        //   },
        //   clickable: true,
        // },
        // 显示当前位置
        {
          id: EVENT_TAP_SHOW_CURRENT_LOCATION,
          iconPath: '/resources/img/icon_locate.png',
          position: {
            left: cLeft,
            top: cTop,
            width: cWidth,
            height: cHeight,
          },
          clickable: true,
        },
      ],
    })
  },

  onSearchTap: (e) => {
    wx.navigateTo({
      url: '../search/search',
    })
  },

  shouldMerge: (m1: Markers, m2: Markers) => {
    if (Math.abs(m1.latitude - m2.latitude) < KILOMETER_LAT &&
          Math.abs(m1.longitude - m2.longitude) < KILOMETER_LNG) {
      return true
    }
    return false
  },

  mergeMarkers: (markers: Array<Markers>) => {
    if (!markers) {
      return markers
    }
    const result: Array<Array<Markers>> = []
    markers.forEach((marker) => {
      if (result.length === 0) {
        result.push([marker])
      } else {
        let shouldAppend = true
        for (const markerArray of result) {
          if (indexPage.shouldMerge(markerArray[0], marker)) {
            markerArray.push(marker)
            shouldAppend = false
            break
          }
        }
        if (shouldAppend) {
          result.push([marker])
        }
      }
    })
    return result
  },

  transformMarkers: (markers: Array<Array<Markers>>) => {
    const result: Array<Markers> = []
    for (const markerArray of markers) {
      const m = markerArray[0]
      if (markerArray.length > 1) {
        m.isMergeMarker = true
        m.children = markerArray.reduce((prev, cur, index) => {
          if (index === 0) {
            return cur.id + ''
          }
          return prev + ',' + cur.id
        }, '')
        m.iconPath = indexPage.getMapIcon(markerArray.length)
      }
      result.push(m)
    }
    return result
  },

  getMapIcon: (num: number) => {
    switch (num) {
      case 2:
        return '/resources/img/icon_two.png'
      case 3:
        return '/resources/img/icon_three.png'
      default:
        return '/resources/img/icon_four.png'
    }
  }
})
