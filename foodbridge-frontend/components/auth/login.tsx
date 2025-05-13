import AuthForm from "../UI/forms/AuthForm";
import { signInSchema } from "../lib/validation";
import { signInWithCredentials } from "../lib/actions/auth";

const SignIn = () => (
  <AuthForm
  type="SIGN_IN"
  schema={signInSchema}
  defaultValues={{
    email: "",
    password: "",

  }}
  onSubmit={signInWithCredentials}
  />
);
export default SignIn;