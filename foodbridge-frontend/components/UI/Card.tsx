import React from 'react'
import {Box,Text,Card,Link,Button} from '@radix-ui/themes'

interface Donor {
    donor : string;
}

interface Recipient {
    recipient : string
}

type Participant = Donor | Recipient;
interface CustomCardProps{
    participant :Participant;
    food_type: string;
    quantity:string;
	// status : string;
}

const CustomCard : React.FC<CustomCardProps>= ({participant,food_type,quantity})=> {
    // const name = 'donor' in participant ? participant.donor : participant.recipient;
  return (
    <Box maxWidth="350px">
	<Card asChild>
        <img src="" alt="" />
		<Link to="#">
			<Text as="div" size="2" weight="bold">
				{food_type}
			</Text>
			<Text as="div" color="gray" size="2">
				{participant}
			</Text>
            <Text as="div" size="2" weight="bold">
			 {quantity}
			</Text>
			<Button>Pending</Button>
		</Link>
	</Card>
</Box>

  )
}
export default CustomCard
