import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { registerSchema, useRegister, type RegisterFormValues } from "@/features/auth";

export function RegisterForm() {
  const navigate = useNavigate();
  const register = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  const onSubmit = (values: RegisterFormValues) => {
    register.mutate(values, {
      onSuccess: () => {
        toast.success("Registration successful! Please login to continue.");
        navigate("/login", { replace: true });
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
        toast.error(axiosErr?.response?.data?.error?.message ?? "Registration failed");
      },
    });
  };

  return (
    <div className="flex flex-col items-center w-full text-slate-900 dark:text-white">
      <div className="mb-8 space-y-2 text-center w-full">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Register!</h1>
      </div>

      <div className="w-full rounded-3xl border border-slate-200 dark:border-[#333] bg-slate-50/95 dark:bg-[#222222]/95 backdrop-blur-3xl p-6 sm:p-8 shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-slate-900 dark:text-white">Full name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl h-12 bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-[#3a3a3a] text-slate-900 dark:text-gray-100 focus-visible:ring-[#42bdf5] placeholder:text-slate-400 dark:placeholder:text-gray-500 shadow-sm"
                      placeholder="Full name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-slate-900 dark:text-white">Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl h-12 bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-[#3a3a3a] text-slate-900 dark:text-gray-100 focus-visible:ring-[#42bdf5] placeholder:text-slate-400 dark:placeholder:text-gray-500 shadow-sm"
                      type="email"
                      autoComplete="email"
                      placeholder="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-slate-900 dark:text-white">Password <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        className="rounded-xl h-12 bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-[#3a3a3a] text-slate-900 dark:text-gray-100 focus-visible:ring-[#42bdf5] pr-10 placeholder:text-slate-400 dark:placeholder:text-gray-500 shadow-sm"
                        type="password" 
                        autoComplete="new-password" 
                        placeholder="Your password"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full rounded-xl h-12 bg-[#1da1f2] hover:bg-[#1a91da] text-white text-base font-bold shadow-md" disabled={register.isPending}>
                {register.isPending ? "Creating…" : "Register"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-[#42bdf5] hover:text-[#20a5e3] transition-colors">
          Login
        </Link>
      </p>
    </div>
  );
}
