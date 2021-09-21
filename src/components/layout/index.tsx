import React from 'react'
import { NavLink } from 'react-router-dom'
import { Box, Flex, Text } from 'theme-ui'
import styled from '@emotion/styled'
import { ROUTES } from '../../constants'
import RTokenIcon from '../icons/logos/RTokenIcon'
import Header from './header'

// TODO: theming
const SideBar = styled.div`
  padding-top: 0;
  flex-grow: 1;
  flex-basis: 256px;
  box-sizing: border-box;
  background-color: black;
  color: white;
  display: flex;
  flex-direction: column;
  /* justify-content: center; */
  border-right: 1px solid #f5f5f5;
`

// TODO: Move sidebar to different component
// TODO: Improve component structure
const PAGES = [
  { path: ROUTES.EXCHANGE, title: 'RSR Dashboard' },
  { path: ROUTES.ISSUANCE, title: 'Issue / Redeem' },
]

/**
 * Application Layout
 *
 * @param children - required
 * @returns {JSX.Element}
 */
const Layout = ({ children }: { children: React.ReactNode }) => (
  <Flex
    sx={{
      flexWrap: 'wrap',
      height: '100vh',
      overflow: 'hidden',
    }}
  >
    <SideBar>
      <Box
        sx={{
          backgroundColor: '#1fea00',
          color: 'black',
          height: 60,
          borderBottom: '1px solid #f5f5f5',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text p={2} sx={{ fontWeight: 'bold' }}>
          Reserve Explorer
        </Text>
      </Box>
      <div style={{ borderBottom: '1px solid #f5f5f5', padding: '1rem' }}>
        <RTokenIcon style={{ fontSize: 32 }} />
      </div>
      <div>
        {PAGES.map((item) => (
          <NavLink
            style={{
              fontSize: 18,
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              margin: 16,
            }}
            to={item.path}
            activeStyle={{ color: '#1fea00' }}
          >
            <Text>{item.title}</Text>
          </NavLink>
        ))}
      </div>
    </SideBar>
    <Box
      sx={{
        flexGrow: 99999,
        flexBasis: 0,
        minWidth: 320,
        overflow: 'hidden',
      }}
    >
      <Header />
      {children}
    </Box>
  </Flex>
)

export default Layout
