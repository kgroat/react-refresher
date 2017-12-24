
import * as React from 'react'

import { PullToRefresh } from './PullToRefresh'

export interface StyledPullToRefreshProps {
  onRefresh: () => Promise<any>
  downArrow?: JSX.Element | string
  upArrow?: JSX.Element | string
  errorIcon?: JSX.Element | string
  successIcon?: JSX.Element | string
  spinner?: JSX.Element | string
  refreshBackground?: string
  refreshColor?: string
  children?: any
}

export interface StyledPullToRefreshState {
  loadingDone: boolean
  error: boolean
}

const SHOW_LOADING_MS = 500
const AFTER_LOADING_MS = 500

export class StyledPullToRefresh extends React.Component<StyledPullToRefreshProps, StyledPullToRefreshState> {
  state: StyledPullToRefreshState = {
    loadingDone: false,
    error: false
  }

  renderLoading = () => {
    return this.state.loadingDone || this.state.error
      ? this.renderDone()
      : this.renderSpinner()
  }

  renderSpinner = () => {
    const {
      spinner = 'Loading...',
      refreshBackground = 'rgba(0, 45, 98, 0.3)',
      refreshColor = '#c41230',
    } = this.props

    return (
      <div style={{ background: refreshBackground, color: refreshColor, height: '100%', display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'scale(0.5)' }}>
          { spinner }
        </div>
      </div>
    )
  }

  renderDone = () => {
    const {
      successIcon = <i className='mdi mdi-check' />,
      errorIcon = <i className='mdi mdi-close' />,
      refreshBackground = 'rgba(0, 45, 98, 0.3)',
      refreshColor = '#c41230',
    } = this.props

    const icon = this.state.error ? errorIcon : successIcon

    return (
      <div style={{ background: refreshBackground, color: refreshColor, height: '100%', display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          { icon }
        </div>
      </div>
    )
  }

  renderRefresh = (willRefresh: boolean) => {
    return this.state.loadingDone || this.state.error
      ? this.renderDone()
      : this.renderArrow(willRefresh)
  }

  renderArrow = (willRefresh: boolean) => {
    const {
      downArrow = <i className='mdi mdi-arrow-down' />,
      upArrow = <i className='mdi mdi-arrow-up' />,
      refreshBackground = 'rgba(0, 45, 98, 0.3)',
      refreshColor = '#c41230',
    } = this.props
    
    const arrow = willRefresh ? upArrow : downArrow

    return (
      <div style={{ background: refreshBackground, color: refreshColor, height: '100%', display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          { arrow }
        </div>
      </div>
    )
  }

  setError = (error: boolean) => {
    return new Promise(resolve => {
      this.setState({ error }, resolve)
    })
  }

  setLoadingDone = (loadingDone: boolean) => {
    return new Promise(resolve => {
      this.setState({ loadingDone }, resolve)
    })
  }

  handleRefresh = () => {
    const promiseToReturn = this.props.onRefresh()
      .then(() => this.setLoadingDone(true))
      .catch(() => this.setError(true))
      .then(() => {
        return new Promise(resolve => setTimeout(resolve, SHOW_LOADING_MS))
      })

    promiseToReturn.then(() => {
      return new Promise(resolve => setTimeout(resolve, AFTER_LOADING_MS))
    })
    .then(() => Promise.all([
      this.setLoadingDone(false),
      this.setError(false)
    ]))
    .catch(() => Promise.all([
      this.setLoadingDone(false),
      this.setError(false)
    ]))

    return promiseToReturn
  }

  render () {
    return (
      <PullToRefresh
        onRefresh={this.handleRefresh}
        renderLoading={this.renderLoading}
        renderRefresh={this.renderRefresh}>
        {this.props.children}
      </PullToRefresh>
    )
  }
}
