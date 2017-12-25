
# React Refresher

## A pull-to-refresh component for react

### Installation
npm:
```
npm install --save react-refresher
```

yarn:
```
yarn add react-refresher
```

### Import
ES6
```javascript
import Refresher from 'react-refresher'
```

ES5
```javascript
var Refresher = require('react-refresher').default
```

### Usage
```javascript
class MyList extends React.Component {
  constructor (props, ctx) {
    super(props, ctx)
    ...

    this.onRefresh = this.onRefresh.bind(this)
    this.state = {
      ...
      articles: []
    }
  }
  ...
  
  onRefresh () {
    return fetch('http://sample.api/article')
      .then(res => res.json())
      .then(articles => this.setState({ articles }))
  }

  render () {
    return (
      <Refresher onRefresh={this.onRefresh}>
        ...
      </Refresher>
    )
  }
}
```
'✔'
'✖'
'↓'
'↑'
### API

| Prop              | Type          | Required? | Default          | Notes                                                                              |
|-------------------|---------------|-----------|------------------|------------------------------------------------------------------------------------|
| onRefresh         | () => Promise | Yes       |                  | The promise should resolve when the re-fetching is complete, or reject on error    |
| loadingHeight     | any           | No        | `70`             | Can be any value valid for the `height` style prop in React                        |
| animationTime     | number        | No        | `500`            | Length of the refresher hiding animation, in milliseconds                          |
| className         | String        | No        | `''`             | This is applied to the entire refresher area (including content area)              |
| downArrow         | JSX.Element   | No        | `'↓'`            | Can also just be a string; default is from [mdi](https://materialdesignicons.com/) |
| upArrow           | JSX.Element   | No        | `'↑'`            | Can also just be a string; default is from [mdi](https://materialdesignicons.com/) |
| errorIcon         | JSX.Element   | No        | `'✖'`            | Can also just be a string; default is from [mdi](https://materialdesignicons.com/) |
| successIcon       | JSX.Element   | No        | `'✔'`            | Can also just be a string; default is from [mdi](https://materialdesignicons.com/) |
| spinner           | JSX.Element   | No        | `'Loading...'`   | Can also just be a string; default is from [mdi](https://materialdesignicons.com/) |
| refreshBackground | String        | No        | `'none'`         | Can be any CSS value that is appropriate for the background prop                   |
| refreshColor      | String        | No        | `'currentColor'` | Can be any CSS value that is appropriate for the color prop                        |

### Advanced usage

#### Internal CSS classes

| CSS class       | Used for                                                                                 |
|-----------------|------------------------------------------------------------------------------------------|
| pull-to-refresh | The entire refresher, around the loader and content                                      |
| loader          | The loader, used to render the up arrow, down arrow, spinner, success, and failure icons |
| content         | The content area, where the children of the refresher are rendered                       |
