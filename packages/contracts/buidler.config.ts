import { task, usePlugin, BuidlerConfig } from '@nomiclabs/buidler/config'

usePlugin('@nomiclabs/buidler-waffle')

export default <BuidlerConfig>{
  solc: {
    version: '0.6.12',
  }
}
