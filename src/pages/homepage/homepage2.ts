import { Book, Result, UserInfo } from '../../api/interfaces'
// pages/homepage/homepage.js
import { addAddress, borrowBook, getBookList, getOtherUserBookList, getOtherUserIntro, getUserInfo, getUserInfoFromServer, getUserIntro, getUserToken, removeBook, setUserIntro } from '../../api/api'
import { hideLoading, showDialog, showErrDialog, showLoading, showToast } from '../../utils/utils'

let homepage: WeApp.Page

Page({
  data: {
    userInfo: {},
    isCurrentUser: true,
    userToken: '',
    userIntro: '',
    bookList: [],
    isHomePage: true,
  },
  onLoad: function(option: any): void {
    homepage = this

    let isCurrentUser = true
    if (option && option.user && option.user !== getUserToken()) {
      isCurrentUser = false
    }

    // 更新数据
    homepage.setData({
      isCurrentUser: isCurrentUser,
    })

    if (isCurrentUser) {
      homepage.setData({
        userInfo: getUserInfo(),
      })
    } else {
      homepage.setData({
        userToken: option.user,
      })
      getUserInfoFromServer(option.user, (result: UserInfo) => {
        homepage.setData({
          userInfo: {
            nickName: result.nickname,
            avatarUrl: result.avatar ? result.avatar : '/resources/img/default_avatar.png',
          },
        })
      }, (failure) => {
        // TODO
      })
    }

    // 获取用户简介
    if (isCurrentUser) {
      getUserIntro((result: string) => {
        let intro = ''
        if (!result || result === '') {
          intro = ''
        } else {
          intro = result
        }
        homepage.setData({
          userIntro: intro,
        })
      }, (failure) => {
        // TODO
      })
    } else {
      getOtherUserIntro(option.user, (result: string) => {
        let intro = ''
        let showIntro = true
        if (!result || result === '') {
          intro = ''
        } else {
          intro = result
        }
        homepage.setData({
          userIntro: intro,
        })
      }, (failure) => {
        // TODO
      })
    }
  },

  onShow: function (): void {
      showLoading('正在加载')
      if (homepage.data.isCurrentUser) {
        getBookList((books: Array<Book>) => {
          hideLoading()
          this.setData({
            bookList: books,
          })
        }, (failure) => {
          hideLoading()
          showErrDialog('无法获取图书列表，请检查您的网络状态')
        })
      } else {
        getOtherUserBookList(homepage.data.userToken, (books: Array<Book>) => {
          hideLoading()
          this.setData({
            bookList: books,
          })
        }, (failure) => {
          hideLoading()
          showErrDialog('无法获取图书列表，请检查您的网络状态')
        })
      }
  },

  onBorrowBook: (e) => {
    let formId = e.detail.formId
    let isbn = e.detail.value.isbn
    if (formId && isbn) {
      showLoading('正在发送借书请求')
      borrowBook(homepage.data.userToken, isbn, formId,
        () => {
          hideLoading()
          showDialog('借书请求已发送，请等待书的主人回复~')
        }, (failure) => {
          hideLoading()
        })
    }
  },

  onBookItemTap: (e) => {
    let book: Book = e.currentTarget.dataset.book
    wx.navigateTo({
        url: '../book/book?title=' + book.title + '&isbn=' + book.isbn,
    })
  },

  onRemoveBook: (e) => {
    showLoading('正在删除')
    removeBook(e.currentTarget.dataset.isbn, (isbn: string) => {
      hideLoading()
      if (homepage.data.bookList) {
        let bookList: Array<Book> = []
        homepage.data.bookList.forEach((book: Book) => {
          let added = book.added
          if (isbn !== book.isbn) {
            bookList.push({
              isbn: book.isbn,
              title: book.title,
              author: book.author,
              url: book.url,
              cover: book.cover,
              publisher: book.publisher,
              added: true,
            })
          }
        })
        homepage.setData({
          bookList: bookList,
        })
        showToast('删除成功')
      }
    }, (failure) => {
      hideLoading()
    })
  },
})
