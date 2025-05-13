import React from 'react'
import {Flex,Avatar} from '@radix-ui/themes'
import { getInitials } from '../lib/util'

// interface User{
//   name : string

// }
// interface AvatarFallbackName{
//   user : User
// }

const CustomAvatar : React.FC = ()=> {
  return (
  <Flex gap="2">
	<Avatar
	src="..."
  className=''
	fallback={getInitials('Hello World')}
  radius='full'
  size='5'
	/>
    </Flex>
  )
}
export default  CustomAvatar;
