package com.company.trackingserver.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.company.trackingserver.entity.Device;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Authenticates tracking agent devices on every request using the
 * {@code X-Device-Id} and {@code X-Device-Secret} headers.
 *
 * <p>Only applies to device-facing endpoints (sync, heartbeat, upload).
 * Missing or invalid credentials leave the security context unauthenticated,
 * which results in a 401 from the authorization rules. Disabled/revoked
 * devices are rejected with a 403.
 */
@Component
@RequiredArgsConstructor
public class DeviceAuthenticationFilter extends OncePerRequestFilter {

    public static final String DEVICE_ID_HEADER = "X-Device-Id";
    public static final String DEVICE_SECRET_HEADER = "X-Device-Secret";
    public static final String ROLE_DEVICE = "ROLE_DEVICE";

    private static final List<String> DEVICE_PATHS = List.of(
            "/api/v1/sync",
            "/api/v1/devices/heartbeat",
            "/api/v1/devices/upload");

    private final DeviceAuthService deviceAuthService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return DEVICE_PATHS.stream().noneMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String deviceId = request.getHeader(DEVICE_ID_HEADER);
        String deviceSecret = request.getHeader(DEVICE_SECRET_HEADER);

        if (deviceId != null && deviceSecret != null
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            Device device = deviceAuthService.authenticate(deviceId, deviceSecret);

            if (device != null) {
                DevicePrincipal principal = DevicePrincipal.from(device);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                List.of(new SimpleGrantedAuthority(ROLE_DEVICE)));

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }
}
