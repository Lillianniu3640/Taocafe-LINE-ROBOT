import linebot from 'linebot'
import dotenv from 'dotenv'
import axios from 'axios'
import fs from 'fs'

// 讓套件讀取 .env檔案
// 讀取後可以用process.env.變數 使用
dotenv.config()
const distance = (lat1, lon1, lat2, lon2, unit = 'K') => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0
  } else {
    const radlat1 = (Math.PI * lat1) / 180
    const radlat2 = (Math.PI * lat2) / 180
    const theta = lon1 - lon2
    const radtheta = (Math.PI * theta) / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
    if (dist > 1) {
      dist = 1
    }
    dist = Math.acos(dist)
    dist = (dist * 180) / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == 'K') {
      dist = dist * 1.609344
    }
    if (unit == 'N') {
      dist = dist * 0.8684
    }
    return dist
  }
}

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

bot.listen('/', process.env.PORT, () => {
  console.log('機器人啟動')
})

bot.on('message', async event => {
  const flex = {
    type: 'carousel',
    contents: []
  }
  const bubbles = []
  const { data } = await axios.get('https://cafenomad.tw/api/v1.2/cafes/taoyuan')
  if (event.message.type === 'text') {
    let opentime = ''
    let url = ''
    try {
      for (const d of data) {
        if (d.address.includes(event.message.text)) {
          if (d.open_time !== '') {
            opentime = d.open_time
          } else {
            opentime = '營業時間請參考店家網址'
          }
          if (d.url !== '') {
            url = d.url
          } else {
            url = 'https://www.google.com/search?q=' + d.name
          }
          console.log(d)
          const z = {
            type: 'bubble',
            size: 'kilo',
            hero: {
              type: 'image',
              url: 'https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip11.jpg',
              size: 'full',
              aspectMode: 'cover',
              aspectRatio: '320:213'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'icon',
                      url: 'https://images.vectorhq.com/images/previews/08e/coffee-cup-icon-29302.png',
                      size: 'xl'
                    },
                    {
                      type: 'text',
                      text: `${d.name}`,
                      weight: 'bold',
                      size: '20px',
                      margin: 'md',
                      offsetStart: 'none'
                    }
                  ]
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'lg',
                  spacing: 'lg',
                  contents: [
                    {
                      type: 'box',
                      layout: 'baseline',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'text',
                          text: '地址',
                          color: '#666666',
                          size: 'sm',
                          flex: 2
                        },
                        {
                          type: 'text',
                          text: `${d.address}`,
                          wrap: true,
                          color: '#666666',
                          size: 'sm',
                          flex: 5
                        }
                      ],
                      margin: '4px',
                      paddingTop: '4px',
                      paddingBottom: '4px'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: '營業時間',
                              color: '#666666',
                              size: 'sm',
                              flex: 2
                            },
                            {
                              type: 'text',
                              text: opentime,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 5
                            }
                          ]
                        }
                      ],
                      margin: '3px',
                      paddingTop: '3px',
                      paddingBottom: '3px'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: 'wifi評分',
                              color: '#666666',
                              size: 'sm',
                              flex: 2
                            },
                            {
                              type: 'text',
                              text: `${d.wifi}`,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 5
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              spacing: 'xl',
              paddingAll: '15px'
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: '地圖導航',
                    uri: `http://maps.google.com/maps?q=loc:${encodeURI(d.latitude)},${encodeURI(d.longitude)}`
                  },
                  height: 'sm',
                  margin: 'md'
                  // style: 'primary'
                },
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: '店家網址',
                    uri: url
                  },
                  height: 'sm',
                  margin: 'md'
                  // style: 'primary'
                }
              ]
            },
            styles: {
              footer: {
                separator: true
              }
            }
          }
          bubbles.push(z)
        }
      }
      // if (bubbles.length === 0) {
      //   event.reply({ type: 'text', text: '附近無搜尋到咖啡店～請試試其他位置' })
      // } else {
      //   event.reply(message)
      // }
    } catch (error) {
      console.log(error)
      event.reply('發生錯誤')
    }
  } else if (event.message.type === 'location') {
    let opentime = ''
    let url = ''
    try {
      for (const d of data) {
        const km = distance(d.latitude, d.longitude, event.message.latitude, event.message.longitude)
        if (d.open_time !== '') {
          opentime = d.open_time
        } else {
          opentime = '營業時間請參考更多資訊'
        }
        if (d.url !=='' == `/http:\/\/.+/`) {
          url = d.url
        } else {
          url = 'https://www.google.com/search?q=' + d.name
        }
        console.log(d)
        if (km <= 0.7) {
          const z = {
            type: 'bubble',
            size: 'kilo',
            hero: {
              type: 'image',
              url: 'https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip12.jpg',
              size: 'full',
              aspectMode: 'cover',
              aspectRatio: '320:213'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    {
                      type: 'icon',
                      url: 'https://images.vectorhq.com/images/previews/08e/coffee-cup-icon-29302.png',
                      size: 'xl'
                    },
                    {
                      type: 'text',
                      text: `${d.name}`,
                      weight: 'bold',
                      size: '20px',
                      margin: 'md',
                      offsetStart: 'none'
                    }
                  ]
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'lg',
                  spacing: 'lg',
                  contents: [
                    {
                      type: 'box',
                      layout: 'baseline',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'text',
                          text: '地址',
                          color: '#666666',
                          size: 'sm',
                          flex: 2
                        },
                        {
                          type: 'text',
                          text: `${d.address}`,
                          wrap: true,
                          color: '#666666',
                          size: 'sm',
                          flex: 5
                        }
                      ],
                      margin: '4px',
                      paddingTop: '4px',
                      paddingBottom: '4px'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: '營業時間',
                              color: '#666666',
                              size: 'sm',
                              flex: 2
                            },
                            {
                              type: 'text',
                              text: opentime,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 5
                            }
                          ]
                        }
                      ],
                      margin: '3px',
                      paddingTop: '3px',
                      paddingBottom: '3px'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: 'wifi評分',
                              color: '#666666',
                              size: 'sm',
                              flex: 2
                            },
                            {
                              type: 'text',
                              text: `${d.wifi}`,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 5
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              spacing: 'xl',
              paddingAll: '15px'
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: '地圖導航',
                    uri: `http://maps.google.com/maps?q=loc:${encodeURI(d.latitude)},${encodeURI(d.longitude)}`
                  },
                  height: 'sm',
                  margin: 'md'
                  // style: 'primary'
                   },
                   {
                     type: 'button',
                     action: {
                       type: 'uri',
                       label: '更多資訊',
                       uri: url
                     },
                     height: 'sm',
                     margin: 'md'
                     // style: 'primary'
                }
              ]
            },
            styles: {
              footer: {
                separator: true
              }
            }
          }
          bubbles.push(z)
        }
      }
    } catch (error) {
      console.log(error)
      event.reply('發生錯誤')
    }
  }
  if (bubbles.length === 0) {
    event.reply({ type: 'text', text: '附近無搜尋到咖啡店～請試試其他位置' })
  } else {
    flex.contents = bubbles
    const message = {
      type: 'flex',
      altText: '尋找的咖啡廳',
      contents: flex
    }

    fs.writeFileSync('aaa.json', JSON.stringify(message, null, 2))
    event.reply(message)
  }
})
