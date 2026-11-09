"use client";

import React, { useState } from "react";
import PropTypes from "prop-types";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { styled as muiStyled, useTheme } from "@mui/material/styles";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "../../Icons/MenuIcon";
import ArrowIcon from "../../Icons/ArrowIcon";
import HeaderArrowIcon from "../../Icons/HeaderArrowIcon";
import { headerLinks } from "@/utils/headerLinks";

const Drawer = dynamic(() => import("@mui/material/Drawer"));

const DrawerHeader = muiStyled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

function ElevationScroll(props) {
  const { children, window } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: window ? window() : undefined,
  });

  return children
    ? React.cloneElement(children, {
        elevation: trigger ? 4 : 0,
      })
    : null;
}

ElevationScroll.propTypes = {
  children: PropTypes.element,
  window: PropTypes.func,
};

export default function ResponsiveNavbar(props) {
  const theme = useTheme();
  const pathname = usePathname();
  const [desktopMenuIndex, setDesktopMenuIndex] = useState(-1);
  const [mobileMenuIndex, setMobileMenuIndex] = useState(-1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerOpen = () => setDrawerOpen(true);
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setMobileMenuIndex(-1);
  };

  const handleMobileParentClick = (event, item, index) => {
    if (item.subLinks?.length) {
      event.preventDefault();
      setMobileMenuIndex((prevIndex) => (prevIndex === index ? -1 : index));
      return;
    }

    handleDrawerClose();
  };

  const desktopMenuItems = headerLinks.map((item, index) => {
    const isOpen = desktopMenuIndex === index;

    return (
      <Box
        className="link"
        component="li"
        key={item.id || item.label}
        sx={{ color: "white", display: "block", position: "relative" }}
        onMouseEnter={() => setDesktopMenuIndex(index)}
        onMouseLeave={() => setDesktopMenuIndex(-1)}
      >
        <Box className="nav-trigger" sx={{ display: "flex", alignItems: "center" }}>
          {!item.subLinks ? (
            <Link href={item.url}>
              <Typography component="span" variant="body1" align="center">
                {item.label}
              </Typography>
            </Link>
          ) : (
            <Typography
              component="span"
              variant="body1"
              align="center"
              className="nav-parent"
            >
              {item.label}
            </Typography>
          )}

          {item.subLinks ? (
            <HeaderArrowIcon className={`arrow ${isOpen ? "rotate" : ""}`} />
          ) : null}
        </Box>

        {item.subLinks ? (
          <Paper
            component="ul"
            variant="outlined"
            className="sublinks-container"
            sx={{
              gridTemplateColumns: item.gridTemplateColumn || "1fr",
              width: item.width || "auto",
              pointerEvents: isOpen ? "auto" : "none",
              transform: isOpen ? "scaleY(1)" : "scaleY(0)",
              opacity: isOpen ? 1 : 0,
            }}
          >
            {item.subLinks.map((subLink) => (
              <li key={subLink.url}>
                <Link
                  href={subLink.url}
                  passHref
                  onClick={() => setTimeout(() => setDesktopMenuIndex(-1), 200)}
                >
                  {subLink.graphic ? (
                    <Image
                      className="icon-wrapper border-radius-8"
                      src={subLink.graphic}
                      alt={subLink.label}
                      width="48"
                      height="48"
                      quality={100}
                    />
                  ) : null}
                  <div className="label-wrapper">
                    <Typography className="subLink" component="span" variant="subtitle1">
                      {subLink.label}
                    </Typography>
                    <Typography className="subLink" component="span" variant="body2">
                      {subLink.subtitle}
                    </Typography>
                  </div>
                </Link>
              </li>
            ))}
          </Paper>
        ) : null}
      </Box>
    );
  });

  const mobileMenuItems = headerLinks.map((item, index) => (
    <li className="flex-auto text-center relative parent-list-item" key={item.id || item.label}>
      <a
        href={item.url}
        className={`parent-link body1 ${pathname === item.url ? "active" : ""}`}
        onClick={(event) => handleMobileParentClick(event, item, index)}
      >
        {item.label}
        {item.subLinks ? <ArrowIcon className="arrow" /> : null}
      </a>

      {item.subLinks ? (
        <ul
          className={`${
            mobileMenuIndex === index ? "block" : "hidden"
          } bg-primary-light text-surface-light top-8 dropdown`}
        >
          {item.subLinks.map((subLink, subIndex) => (
            <li
              key={subLink.url}
              className="text-left child-list-item"
              onClick={() => handleDrawerClose()}
            >
              <Divider
                key={`${subLink.url}-${subIndex}`}
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              <Link href={subLink.url} className="child-link">
                {subLink.graphic ? (
                  <Image
                    className="icon-wrapper border-radius-8"
                    src={subLink.graphic}
                    alt={subLink.label}
                    width="40"
                    height="40"
                    quality={100}
                  />
                ) : null}
                <div className="label-wrapper">
                  <Typography className="subLink" component="span" variant="subtitle1">
                    {subLink.label}
                  </Typography>
                  <Typography className="subLink" component="span" variant="body2">
                    {subLink.subtitle}
                  </Typography>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <Divider key={`${item.url}-${index}`} />
    </li>
  ));

  return (
    <>
      <ElevationScroll {...props}>
        <AppBar
          className="unified-navbar"
          position="fixed"
          sx={{
            background: "var(--light-surface-container-lowest)",
            borderBottom: "1px solid var(--light-outline-variant)",
            boxShadow: "none",
            top: "42px",
            zIndex: 10000,
            py: { lg: 1, xs: 0 },
            backdropFilter: { xs: "blur(7.6px)", lg: "none" },
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: "6px !important", lg: "24px !important" } }}>
            <Toolbar
              disableGutters
              className="grid-links-wrapper"
              sx={{
                minHeight: { lg: "58px !important", xs: "56px !important" },
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: { xs: "flex", lg: "none" },
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                id="menu-container"
              >
                <div className="menu-logo-wrapper">
                  <IconButton
                    size="small"
                    aria-label="Open navigation menu"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleDrawerOpen}
                    color="primary"
                    disableRipple={true}
                    className="hamburger-icon"
                  >
                    <MenuIcon fontSize="large" />
                  </IconButton>
                  <Link href="/" className="logo-wrapper">
                    <Image
                      src="/logo.png"
                      width={1080/6}
                      height={139/6}
                      alt="Junk Removals"
                    style={{ cursor: "pointer", display: "block" }}
                      quality={100}
                      priority
                    />
                  </Link>
                </div>
              </Box>

              <Box
                sx={{
                  display: { xs: "none", lg: "flex" },
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Link href="/">
                  <Image
                    src="/logo.png"
                    width={1080/4}
                    height={139/4}
                    alt="Junk Removals"
                    style={{ cursor: "pointer", display: "block"}}
                    quality={100}
                    priority
                  />
                </Link>

                <div className="links-wrapper">
                  <Box
                    component="ul"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      margin: 0,
                    }}
                  >
                    {desktopMenuItems}
                  </Box>
                  <Link href="/#get-free-quote" className="quote-button">
                    <Button size="large" variant="contained">
                      GET FREE QUOTE
                    </Button>
                  </Link>
                </div>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </ElevationScroll>

      <Box
        className="drawer-box"
        sx={{ display: { xs: "flex", lg: "none" }, position: "fixed", zIndex: "100" }}
        role="presentation"
        id="menu-appbar"
      >
        <Drawer
          className="mobile-drawer"
          sx={{
            width: "95%",
            maxWidth: "500px",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              top: "98px",
              height: "calc(100% - 98px)",
              width: "95%",
              maxWidth: "500px",
              boxSizing: "border-box",
              backgroundColor: "var(--light-surface-container-low)",
            },
          }}
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerClose}
        >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "ltr" ? (
                <ChevronLeftIcon className="chevron-left-icon" />
              ) : (
                <ChevronLeftIcon className="chevron-right-icon" />
              )}
            </IconButton>
          </DrawerHeader>
          <ul className="list-container">{mobileMenuItems}</ul>
          <Link href="/" style={{ margin: "16px" }}>
            <Button
              size="large"
              variant="outlined"
              className="button"
              onClick={handleDrawerClose}
              sx={{ width: "100%" }}
            >
              GET FREE QUOTE
            </Button>
          </Link>
        </Drawer>
      </Box>
    </>
  );
}
