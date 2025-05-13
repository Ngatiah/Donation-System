// import React from "react";
import type{
  DefaultValues,
  FieldValues,
  Path,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import {useForm } from 'react-hook-form'
import { ZodType } from "zod";
import {Link} from 'react-router-dom'
import {toast} from '../../hooks/use-toast'
import { useNavigate } from "react-router-dom";
import {PhoneInput} from '../PhoneInput'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../Form";
import { Input } from "../Input";
import { Button } from "../Button";
import { FIELD_NAMES, FIELD_TYPES } from "../../constants";
import { zodResolver } from "@hookform/resolvers/zod";
interface Props<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<{ success: boolean; error?: string }>;
  type: "SIGN_IN" | "SIGN_UP";
}

type Role = 'donor' | 'recipient';

function AuthForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  type,
}: Props<T>) {
  const navigate = useNavigate();
  const isSignIn = type === "SIGN_IN";
  const form: UseFormReturn<T> = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });
  const role = form.watch('role' as Path<T>) as Role;

  const handleSubmit: SubmitHandler<T> = async (data) => {
    console.log("FORM DATA", data);

    const result = await onSubmit(data);

    if (result.success) {
      toast({
        title: "Success",
        description: isSignIn
          ? "You have successfully signed in."
          : "You have successfully signed up.",
      });
      navigate("/home");
    } else {
      toast({
        title: `Error ${isSignIn ? "signing in" : "signing up"}`,
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-white">
        {isSignIn
          ? "Welcome Back to the FoodBridge"
          : "Create Your Donations Account"}
      </h1>
      <p className="text-light-100">
        {isSignIn
          ? "Welcome back! Log in to continue accessing the vast network of donors and recipients. Stay updated on real-time donation opportunities and help make a difference in people's lives."

          : "Create your Donations account and become a part of our compassionate community. "
          }
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-6"
        >
          {Object.keys(defaultValues)
        .filter((field) => field !== "role")
        .map((field) => {
          if ((field === 'food_type' || field === 'quantity') && role !== 'recipient') {
            return null;
          }
          return (
            <FormField
              key={field}
              control={form.control}
              name={field as Path<T>}
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel className="capitalize">
                      {FIELD_NAMES[field.name as keyof typeof FIELD_NAMES]}
                    </FormLabel>
                    <FormControl>
                    {field.name === 'contact_phone' ? (
                        <PhoneInput
                          {...field}
                          onChange={(e) => {
                            // Remove leading 0 if entered
                            const val = e.target.value.replace(/^0/, "");
                            field.onChange(val);
                          }}
                        />
                      ) : (
                        <Input
                          required
                          type={FIELD_TYPES[field.name as keyof typeof FIELD_TYPES]}
                          {...field}
                          className="form-input"
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          );
        })}
      {!isSignIn && (
            <FormField
              control={form.control}
              name={"role" as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose your role</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="donor"
                          checked={field.value === "donor"}
                          onChange={field.onChange}
                        />
                        Donor
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="recipient"
                          checked={field.value === "recipient"}
                          onChange={field.onChange}
                        />
                        Recipient
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="form-btn">
            {isSignIn ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-base font-medium">
        {isSignIn ? "No account yet?" : "Have an account already?"}{" "}
        <Link
        to={isSignIn ? "/register" : "/login"}
          className="font-bold text-primary"
        >
          {isSignIn ? "Sign Up" : "Sign In"}
        </Link>
      </p>
    </div>
  );
};
export default AuthForm;