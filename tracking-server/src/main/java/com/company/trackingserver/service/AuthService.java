package com.company.trackingserver.service;

import com.company.trackingserver.dto.LoginRequest;
import com.company.trackingserver.dto.LoginResponse;
import com.company.trackingserver.dto.LogoutRequest;
import com.company.trackingserver.dto.RefreshTokenRequest;
import com.company.trackingserver.dto.RegisterUserRequest;
import com.company.trackingserver.entity.Employee;
import com.company.trackingserver.entity.UserAccount;
import com.company.trackingserver.repository.EmployeeRepository;
import com.company.trackingserver.repository.UserAccountRepository;
import com.company.trackingserver.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    private final Set<String> revokedRefreshTokens = ConcurrentHashMap.newKeySet();

    public AuthService(
            AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService,
            JwtService jwtService,
            UserAccountRepository userAccountRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());
        return buildLoginResponse(userDetails);
    }

    public LoginResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();

        if (revokedRefreshTokens.contains(refreshToken)) {
            throw new IllegalArgumentException("Refresh token has been revoked");
        }

        if (jwtService.isTokenExpired(refreshToken)) {
            throw new IllegalArgumentException("Refresh token has expired");
        }

        String username = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        return buildLoginResponse(userDetails);
    }

    public void logout(LogoutRequest request) {
        String refreshToken = request.refreshToken();
        if (refreshToken != null && !refreshToken.isBlank()) {
            revokedRefreshTokens.add(refreshToken);
        }
    }

    @Transactional
    public void registerUser(RegisterUserRequest request) {
        if (userAccountRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }

        Employee employee = null;
        if (request.employeeId() != null) {
            employee = employeeRepository.findById(request.employeeId())
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        UserAccount account = new UserAccount();
        account.setUsername(request.username());
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setRole(request.role());
        account.setEmployee(employee);
        account.setEnabled(true);
        account.setCreatedAt(now);
        account.setUpdatedAt(now);

        userAccountRepository.save(account);
    }

    private LoginResponse buildLoginResponse(UserDetails userDetails) {
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .orElse("EMPLOYEE");

        return new LoginResponse(
                accessToken,
                refreshToken,
                "Bearer",
                900_000L,
                userDetails.getUsername(),
                role);
    }
}
