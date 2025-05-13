import React from 'react'
import {Box,Text,Card,Link,Button} from '@radix-ui/themes'
import CustomAvatar from './Avatar'

interface Donor {
    donor : string;
}

interface Recipient {
    recipient : string
}

type Participant = Donor | Recipient;

interface CustomCardProps{
    participant :Participant;
    quantity : number;
}

const ListCard : React.FC<CustomCardProps>= ({participant,quantity})=> {
    // const name = 'donor' in participant ? participant.donor : participant.recipient;
  return (
	<Link to="#">
    <Box maxWidth="350px">
	<Card asChild>
        {/* <img src="" alt="" /> */}
        <CustomAvatar/>
			<Text as="div" color="gray" size="2">
				{participant}
			</Text>
            <Text as="div" size="2" weight="bold">
			 {quantity}
			</Text>
	</Card>
</Box>
</Link>

  )
}
export default ListCard