import * as React from 'react'

export interface PullToRefreshProps {
  onRefresh: () => Promise<any>
  className?: string
  renderLoading?: () => React.ReactElement<any>
  renderRefresh?: (willRefresh: boolean) => React.ReactElement<any>
  loadingHeight?: React.CSSProperties['height']
  animationTime?: number
}

export interface PullToRefreshState {
  touchState: Touch | null
  deltaTouchY: number
  scrollStart: number
  animationStartTime: number | null
  loading: boolean
}

export interface Touch {
  touchId: number
  originTouchY: number
}

const DEFAULT_LOADING_HEIGHT = 70
const DEFAULT_ANIMATION_TIME = 300

export class PullToRefresh extends React.Component<PullToRefreshProps, PullToRefreshState> {
  container: HTMLDivElement
  content: HTMLDivElement

  state: PullToRefreshState = {
    touchState: null,
    deltaTouchY: 0,
    scrollStart: 0,
    animationStartTime: null,
    loading: false,
  }

  componentDidMount () {
    if (this.container) {
      this.container.scrollTop = this.getLoadingHeight()
    }
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize)
  }

  render () {
    const loadingHeight = this.props.loadingHeight || DEFAULT_LOADING_HEIGHT

    return (
      <div
        className={`pull-to-refresh ${this.props.className}`}
        ref={this.setContainer}
        onTouchStart={this.onTouchStart}
        onTouchMove={this.onTouchMove}
        onTouchEnd={this.onTouchEnd}
        onScroll={this.onScroll}
        style={{ overflowY: 'scroll', flexGrow: 1, flexShrink: 1, height: '100%' }}>
        <div style={{ fontSize: loadingHeight * 3 / 7 }}>
          <div className='loader' style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', height: loadingHeight, position: 'relative' }}>
            { this.renderLoader() }
          </div>
        </div>
        <div className='content' ref={this.setContent}>
          { this.props.children }
        </div>
      </div>
    )
  }

  private getLoadingHeight = () => this.props.loadingHeight || DEFAULT_LOADING_HEIGHT

  private getAnimationTime = () => this.props.animationTime || DEFAULT_ANIMATION_TIME

  private setContainer = (el: HTMLDivElement) => {
    this.container = el
  }

  private setContent = (el: HTMLDivElement) => {
    this.content = el
    this.handleResize()
  }

  private getTouch (ev: React.TouchEvent<HTMLDivElement>): React.Touch | null {
    return this.state.touchState ? ev.touches.item(this.state.touchState.touchId) : null
  }

  private onTouchStart = (ev: React.TouchEvent<HTMLDivElement>) => {
    if (!this.state.loading && this.state.touchState === null) {
      const touch = ev.touches[0]
      this.setState({
        touchState: {
          touchId: touch.identifier,
          originTouchY: touch.clientY,
        },
        deltaTouchY: 0,
        scrollStart: this.container.scrollTop,
        animationStartTime: null,
      })
    }
  }

  private onTouchEnd = (ev: React.TouchEvent<HTMLDivElement>) => {
    const touch = this.getTouch(ev)
    if (!touch) {
      const actualScroll = this.state.scrollStart - this.state.deltaTouchY
      this.setState({
        touchState: null,
        deltaTouchY: 0,
      })
      if (actualScroll <= 0) {
        this.handleRefresh()
      } else {
        this.handleReset()
      }
    }
  }

  private onTouchMove = (ev: React.TouchEvent<HTMLDivElement>) => {
    const touch = this.getTouch(ev)
    if (this.state.touchState && touch) {
      const deltaTouchY = touch.clientY - this.state.touchState.originTouchY
      const newTop = this.state.scrollStart - deltaTouchY
      if (newTop < 0) {
        this.setState({
          deltaTouchY,
          touchState: {
            touchId: this.state.touchState.touchId,
            originTouchY: this.state.touchState.originTouchY - newTop,
          },
        })
      } else {
        this.setState({
          deltaTouchY,
        })
      }

      if (this.container) {
        this.container.scrollTop = newTop
      }
    }
  }

  private onScroll = (ev: React.UIEvent<HTMLDivElement>) => {
    if (this.container
      && this.state.touchState === null
      && !this.state.animationStartTime
      && !this.state.loading
      && this.container.scrollTop < this.getLoadingHeight()) {
      ev.preventDefault()
      this.container.scrollTop = this.getLoadingHeight()
    } else if (this.state.touchState) {
      ev.preventDefault()
    }
  }

  private handleRefresh = () => {
    if (this.state.loading) {
      return
    }
    this.setState({
      loading: true,
    })

    this.props.onRefresh()
      .then(this.handleReset)
      .catch(this.handleReset)
  }

  private handleReset = () => {
    this.setState({
      loading: false,
      animationStartTime: Date.now(),
    })
    const scrollStart = this.container ? this.container.scrollTop : 0
    const scrollDelta = this.getLoadingHeight() - scrollStart

    const setScroll = () => {
      const scrollTop = this.container ? this.container.scrollTop : 0
      if (!this.state.animationStartTime || this.state.touchState) {
        return
      }
      const timeDelta = Date.now() - this.state.animationStartTime
      if (timeDelta > this.getAnimationTime()) {
        const newScroll = this.getLoadingHeight()
        if (this.container && scrollTop < newScroll) {
          this.container.scrollTop = newScroll
        }
        this.setState({
          animationStartTime: null,
        })
      } else {
        const deltaPercent = timeDelta / this.getAnimationTime()
        const newScroll = scrollStart + scrollDelta * deltaPercent
        if (this.container && scrollTop < newScroll) {
          this.container.scrollTop = newScroll
        }
        requestAnimationFrame(setScroll)
      }
    }

    requestAnimationFrame(setScroll)
  }

  private handleResize = () => {
    if (this.content && this.content.parentElement) {
      this.content.style.minHeight = `${this.content.parentElement.clientHeight}px`
    }
  }

  private renderLoading () {
    if (this.props.renderLoading) {
      return this.props.renderLoading()
    } else {
      return (
        <div style={{ textAlign: 'center', verticalAlign: 'center' }}>
          <span style={{ display: 'inline-block' }}>Loading...</span>
        </div>
      )
    }
  }

  private renderRefresh () {
    const actualScroll = this.state.scrollStart - this.state.deltaTouchY
    const willRefresh = actualScroll <= 0
    if (this.props.renderRefresh) {
      return this.props.renderRefresh(willRefresh)
    } else {
      return <div style={{ textAlign: 'center' }}>{ willRefresh ? '↑' : '↓' }</div>
    }
  }

  private renderLoader () {
    if (this.state.loading) {
      return this.renderLoading()
    } else {
      return this.renderRefresh()
    }
  }
}
