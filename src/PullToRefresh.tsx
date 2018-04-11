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
  animationStartTime: number | null
  loading: boolean
}

export interface Touch {
  touchId: number
}

const DEFAULT_LOADING_HEIGHT = 70
const DEFAULT_ANIMATION_TIME = 300

export class PullToRefresh extends React.Component<PullToRefreshProps, PullToRefreshState> {
  container: HTMLDivElement
  content: HTMLDivElement

  state: PullToRefreshState = {
    touchState: null,
    animationStartTime: null,
    loading: false,
  }

  private mounted = false

  componentDidMount () {
    this.mounted = true
    if (this.container) {
      this.container.scrollTop = this.getLoadingHeight()
    }
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount () {
    this.mounted = false
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

  private getLoadingBreakpoint = () => this.getLoadingHeight() / 3

  private willRefresh = () => this.container ? this.container.scrollTop <= this.getLoadingBreakpoint() : false

  private setContainer = (el: HTMLDivElement) => {
    this.container = el
  }

  private setContent = (el: HTMLDivElement) => {
    this.content = el
    this.handleResize()
  }

  private getTouch (ev: React.TouchEvent<HTMLDivElement>): React.Touch | null {
    if (!this.state.touchState) {
      return null
    }

    const { touchId } = this.state.touchState
    return Array.prototype.find.call(ev.changedTouches, (touch: React.Touch) => touch.identifier === touchId)
  }

  private onTouchStart = (ev: React.TouchEvent<HTMLDivElement>) => {
    if (!this.state.loading && this.state.touchState === null) {
      const touch = ev.touches[0]

      this.setState({
        touchState: {
          touchId: touch.identifier,
        },
        animationStartTime: null,
      })
    }
  }

  private onTouchEnd = (ev: React.TouchEvent<HTMLDivElement>) => {
    const touch = this.getTouch(ev)
    if (touch) {
      this.setState({
        touchState: null,
      })
      if (this.willRefresh()) {
        this.handleRefresh()
      } else {
        this.handleReset()
      }
    }
  }

  private onTouchMove = (ev: React.TouchEvent<HTMLDivElement>) => {
    const touch = this.getTouch(ev)
    if (this.state.touchState && touch) {
      this.forceUpdate()
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
      if (!this.mounted) {
        return
      }
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
    if (this.props.renderRefresh) {
      return this.props.renderRefresh(this.willRefresh())
    } else {
      return <div style={{ textAlign: 'center' }}>{ this.willRefresh() ? '↑' : '↓' }</div>
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
