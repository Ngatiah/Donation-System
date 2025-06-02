import React from "react";
import { signUp } from "../lib/actions/auth";
import { signUpSchema } from "../lib/validation";
import AuthForm from "../UI/forms/AuthForm";

const SignUp : React.FC = () => (
    <AuthForm
    type="SIGN_UP"
    schema={signUpSchema}
    defaultValues={{
      name: "",
      email: "",
      password: "",
      role : 'donor',
      // food_type :'',
      food_type :[],
      quantity :0,
      contact_phone:'',
      city:''
    }}
    onSubmit={signUp}
    />
);
export default SignUp;