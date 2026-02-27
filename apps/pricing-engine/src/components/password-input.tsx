import * as React from "react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { cn } from "@repo/lib/cn"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "./ui/input-group"

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    return (
      <InputGroup className={cn(className)}>
        <InputGroupInput
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          ref={ref}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            disabled={disabled}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <IconEye size={18} /> : <IconEyeOff size={18} />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
