package com.crm.domain.user;

import com.crm.domain.user.dto.CreateUserRequest;
import com.crm.domain.user.dto.UpdateProfileRequest;
import com.crm.domain.user.dto.UpdateUserRequest;
import com.crm.domain.user.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(@AuthenticationPrincipal UserDetails currentUser) {
        User user = userService.findByEmail(currentUser.getUsername());
        return ResponseEntity.ok(UserDto.from(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserDetails currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        User current = userService.findByEmail(currentUser.getUsername());
        User updated = userService.updateProfile(current.getId(), request);
        return ResponseEntity.ok(UserDto.from(updated));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.findAll().stream()
                .map(UserDto::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.from(user));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        User user = userService.updateUser(id, request);
        return ResponseEntity.ok(UserDto.from(user));
    }
}
