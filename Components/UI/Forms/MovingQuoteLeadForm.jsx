"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import { quoteImageError, QUOTE_IMAGE_TYPES } from "@/utils/quoteImage.mjs";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Input from "./InputFields/Input";
import GoogleAutocomplete from "@/Components/GoogleMaps/GoogleAutoComplete";
import { useRouter } from "next/navigation";
import { useClickIds } from "@/hooks/useClickIds";
import { sendFormSubmissionToGoogleTagManager } from "@/utils/googleTagManager";
import styles from "./MovingQuoteLeadForm.module.scss";
import { submitQuote } from "@/utils/submitQuote.mjs";

const FORM_FIELDS = [
  {
    id: "firstname",
    label: "First name",
    type: "text",
    required: true,
    autoComplete: "given-name",
    errorMessage: "First name should be at least 3 characters long",
    validation: (value) => typeof value === "string" && value.trim().length > 2,
  },
  {
    id: "email",
    label: "Email address",
    type: "email",
    required: true,
    autoComplete: "email",
    errorMessage: "Enter a valid email address",
    validation: (value) => /\S+@\S+\.\S+/.test(value || ""),
  },
  {
    id: "phone",
    label: "Phone number",
    type: "tel",
    required: false,
    autoComplete: "tel",
    errorMessage: "Please enter a valid New Zealand phone number",
    validation: (value) => {
      const cleanPhone = (value || "").replace(/[^0-9]/g, "");
      return cleanPhone.length > 6;
    },
  },
  {
    // Keep local address state separate from the HubSpot property name.
    id: "address",
    label: "Property address",
    required: false,
    errorMessage: "Please enter a valid address",
    validation: (value) => typeof value === "string" && value.trim().length > 5,
  },

];

const INITIAL_FORM_DATA = {
  firstname: "",
  email: "",
  phone: "",
  address: "",
};

const INITIAL_GOOGLE_ADDRESS = {
  address: {},
};

function isFieldValid(field, value) {
  if (!field.required && !value) {
    return true;
  }

  return field.validation(value);
}

export default function MovingQuoteLeadForm({
  formName = "Get a Free Junk Removal Quote",
  title = "Get Your Free Quote",
  subtitle = "Takes 60 seconds. No obligation whatsoever.",
  highlightText = "Quick Response, Auckland-Wide",
  submitButtonText = "GET FREE QUOTE",
  showPhoneCta = true,
  footerNote = "Honest advice • Free Quote • No obligation",
  className = "",
}) {
  const router = useRouter();
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER;
  const { clickIds } = useClickIds();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const imageInput = useRef(null);
  const deliveries = useRef(null);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    const validationError = quoteImageError(file);
    setImageError(validationError);
    setImage(validationError ? null : file);
    if (validationError) event.target.value = "";
  };

  const removeImage = () => {
    setImage(null);
    setImageError("");
    if (imageInput.current) imageInput.current.value = "";
  };
  const [isLoading, setIsLoading] = useState(false);
  const [googleAdsAddress, setGoogleAdsAddress] = useState(INITIAL_GOOGLE_ADDRESS);

  const fieldsById = useMemo(
    () => Object.fromEntries(FORM_FIELDS.map((field) => [field.id, field])),
    []
  );

  const handleChange = (id, value) => {
    const nextValue = value?.target ? value.target.value : value;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [id]: nextValue,
    }));

    if (errors[id]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: false,
      }));
    }
  };

  const handleBlur = (id) => {
    const field = fieldsById[id];
    if (!field) return;

    if (!isFieldValid(field, formData[id])) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: true,
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    FORM_FIELDS.forEach((field) => {
      if (!isFieldValid(field, formData[field.id])) {
        nextErrors[field.id] = true;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitHandler = async (event) => {
    event.preventDefault();

    // Read the actual file input at submit time as well as React state.
    const selectedImage = imageInput.current?.files?.[0] || image;
    const selectedImageError = quoteImageError(selectedImage);
    if (!validateForm() || imageError || selectedImageError) {
      if (selectedImageError) setImageError(selectedImageError);
      return;
    }

    const deliveryKey = JSON.stringify({ formData, clickIds, formName });
    if (deliveries.current?.key !== deliveryKey || deliveries.current?.image !== selectedImage) {
      deliveries.current = { key: deliveryKey, image: selectedImage, hubspot: false, email: false };
    }
    const currentDelivery = deliveries.current;

    const parts = formData.firstname.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const formattedDate = dayjs().valueOf();
    const transactionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Everything but name and email is optional, so spell out the blanks
    // rather than mailing through a row of empty labels.
    const orBlank = (value) =>
      typeof value === "string" && value.trim() ? value.trim() : "Not provided";

    // Use the field names already defined by the HubSpot form.
    const detailSummary = `First Name: ${formData.firstname}
Email: ${formData.email}
Phone Number: ${orBlank(formData.phone)}
Property Address: ${orBlank(formData.address)}
Submitted: ${dayjs(formattedDate).format("DD/MM/YYYY HH:mm")}`;

    const dataPayload = {
      email: formData.email,
      formName,
      message: detailSummary,
      portalID: process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID,
      hubspotFormID: process.env.NEXT_PUBLIC_HUBSPOT_QUOTE_FORM_ID,
      hubspotFileField: "junk_photo",
      hubspotFormObject: [
        { name: "firstname", value: formData.firstname },
        { name: "email", value: formData.email },
        { name: "phone", value: formData.phone },
        { name: "property_address", value: formData.address },
      ],
    };

    const configGoogleAdsConversion = {
      method: "post",
      url: "/api/google-ads-conversion",
      headers: { "Content-Type": "application/json" },
      data: {
        clickIds,
        email: formData.email,
        phone: formData.phone,
        transactionId,
        conversionValue: 0,
        currencyCode: "NZD",
      },
    };

    setIsLoading(true);
    setError("");

    try {
      // Retrying after one provider failed must not resend to the provider
      // that already accepted this unchanged request.
      const results = await Promise.allSettled([
        currentDelivery.hubspot ? Promise.resolve() : submitQuote("/api/submit-hubspot-form", dataPayload, selectedImage).then(() => { currentDelivery.hubspot = true; }),
        currentDelivery.email ? Promise.resolve() : submitQuote("/api/sendmail", dataPayload, selectedImage).then(() => { currentDelivery.email = true; }),
      ]);
      const failed = results.find(result => result.status === "rejected");
      if (failed) throw failed.reason;

      if (currentDelivery.hubspot && currentDelivery.email) {
        axios(configGoogleAdsConversion).catch((conversionError) => {
          console.warn("Google Ads conversion upload skipped/failed", conversionError);
        });

        sendFormSubmissionToGoogleTagManager({
          eventName: "quote_form_submission",
          formName: "Junk Removal Quote",
          transactionId,
          conversionValue: 0,
          currency: "NZD",
          clickIds,
          formData: {
            firstName,
            email: formData.email,
            phone: formData.phone,
            street: `${googleAdsAddress.address.streetNumber || ""} ${
              googleAdsAddress.address.streetName || ""
            }`.trim(),
            city: googleAdsAddress.address.city,
            region: googleAdsAddress.address.region,
            postCode: googleAdsAddress.address.postalCode,
          },
        });

        router.push("/form-submitted/thank-you");
        return;
      }

      setError("Something went wrong. Please try again.");
    } catch (submitError) {
      setError(submitError.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={submitHandler}
      noValidate
      className={`${styles.formCard} ${className}`}
    >
      <Box className={styles.header}>
        <Typography variant="h4" component="h2" className={styles.title}>
          {title}
        </Typography>
        <Typography variant="body1" component="p" className={styles.subtitle}>
          {subtitle}
        </Typography>
      </Box>

      <Box className={styles.highlightBar}>
        <BoltIcon sx={{ fontSize: 18 }} />
        <Typography variant="subtitle1" component="p" >
          {highlightText}
        </Typography>
      </Box>

      <Box className={styles.fields}>
        {FORM_FIELDS.slice(0, 3).map((field) => (
          <Input
            key={field.id}
            lightTheme={true}
            label={field.required ? `${field.label}` : field.label}
            type={field.type}
            value={formData[field.id]}
            onChange={(value) => handleChange(field.id, value)}
            onBlur={() => handleBlur(field.id)}
            required={field.required}
            autoComplete={field.autoComplete}
            isInvalid={errors[field.id]}
            errorMessage={field.errorMessage}
            id={field.id}
            minRows={field.type === "textarea" ? 4 : undefined}
          />
        ))}

        <GoogleAutocomplete
          className={styles.fullWidthField}
          label="Property address"
          value={formData.address}
          onChange={(value) => handleChange("address", value)}
          onSelect={(selectedAddress) => {
            setFormData((prevData) => ({
              ...prevData,
              address: selectedAddress.formattedAddress,
            }));
            setGoogleAdsAddress((prevData) => ({
              ...prevData,
              address: selectedAddress.unformattedAddress,
            }));

            if (errors.address) {
              setErrors((prevErrors) => ({
                ...prevErrors,
                address: false,
              }));
            }
          }}
          required={false}
          autoComplete="street-address"
          error={errors.address}
          helperText="Please enter a valid address"
        />

        <Box className={styles.imageUpload}>
          <Typography component="p" className={styles.uploadTitle}>
            Photo of your items <span>(optional)</span>
          </Typography>
          <Typography component="p" id="quote-photo-help" className={styles.uploadHelp}>
            Show us what needs to go for a more accurate quote. JPG, PNG or WebP, up to 3 MB.
          </Typography>
          <label className={styles.uploadPicker}>
            <input
              ref={imageInput}
              type="file"
              name="image"
              accept={QUOTE_IMAGE_TYPES.join(",")}
              onChange={handleImageChange}
              disabled={isLoading}
              aria-label={image ? "Change photo of your items" : "Upload a photo of your items"}
              aria-describedby={`quote-photo-help${imageError ? " quote-photo-error" : ""}`}
              aria-invalid={Boolean(imageError)}
              className={styles.uploadInput}
            />
            <AddPhotoAlternateOutlinedIcon aria-hidden="true" />
            <span>{image ? "Change photo" : "Choose a photo"}</span>
          </label>
          {image ? (
            <Box className={styles.uploadSelection}>
              {imagePreview ? (
                // A local blob preview never leaves the browser before submission.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Selected items for removal" className={styles.uploadPreview} />
              ) : null}
              <span className={styles.uploadFilename}>{image.name}</span>
              <button type="button" onClick={removeImage} disabled={isLoading} className={styles.removeImage}>
                Remove
              </button>
            </Box>
          ) : null}
          {imageError ? <p id="quote-photo-error" role="alert" className={styles.uploadError}>{imageError}</p> : null}
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? "Sending your quote request…" : submitButtonText}
        </Button>

        {showPhoneCta && phoneNumber ? (
          <Button
            variant="text"
            href={`tel:${phoneNumber}`}
            startIcon={<LocalPhoneIcon />}
            className={styles.phoneButton}
          >
            Prefer to talk? {phoneNumber}
          </Button>
        ) : null}

        <Divider className={styles.divider} />

        <Typography variant="body1" component="p" className={styles.footerNote}>
          {footerNote}
        </Typography>

        <Box className={styles.privacyNote}>
          <LockOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" component="p">
            Your details are safe & never shared
          </Typography>
        </Box>

        {error ? (
          <Alert sx={{ marginTop: "16px" }} severity="error">
            {error}
          </Alert>
        ) : null}
      </Box>
    </Box>
  );
}
