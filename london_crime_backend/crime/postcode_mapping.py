"""
Mapping of London postcode prefixes (outward codes) to borough area_name values
that match the CrimeRecord database.

The outward code is the first part of a UK postcode, e.g. "SW1A" from "SW1A 2AA".
Many outward codes span multiple boroughs; we map to the primary one.
"""

POSTCODE_TO_BOROUGH = {
    # E postcodes
    'E1': 'Tower Hamlets',
    'E1W': 'Tower Hamlets',
    'E2': 'Tower Hamlets',
    'E3': 'Tower Hamlets',
    'E4': 'Waltham Forest',
    'E5': 'Hackney',
    'E6': 'Newham',
    'E7': 'Newham',
    'E8': 'Hackney',
    'E9': 'Hackney',
    'E10': 'Waltham Forest',
    'E11': 'Waltham Forest',
    'E12': 'Newham',
    'E13': 'Newham',
    'E14': 'Tower Hamlets',
    'E15': 'Newham',
    'E16': 'Newham',
    'E17': 'Waltham Forest',
    'E18': 'Redbridge',
    'E20': 'Newham',

    # EC postcodes (City / fringe)
    'EC1': 'Islington',
    'EC1A': 'Islington',
    'EC1M': 'Islington',
    'EC1N': 'Camden',
    'EC1R': 'Islington',
    'EC1V': 'Islington',
    'EC1Y': 'Islington',
    'EC2': 'Islington',
    'EC2A': 'Hackney',
    'EC2M': 'Islington',
    'EC2N': 'Islington',
    'EC2R': 'Islington',
    'EC2V': 'Islington',
    'EC2Y': 'Islington',
    'EC3': 'Tower Hamlets',
    'EC3A': 'Tower Hamlets',
    'EC3M': 'Tower Hamlets',
    'EC3N': 'Tower Hamlets',
    'EC3R': 'Tower Hamlets',
    'EC3V': 'Tower Hamlets',
    'EC4': 'Camden',
    'EC4A': 'Camden',
    'EC4M': 'Camden',
    'EC4N': 'Camden',
    'EC4R': 'Camden',
    'EC4V': 'Camden',
    'EC4Y': 'Camden',

    # N postcodes
    'N1': 'Islington',
    'N1C': 'Camden',
    'N1P': 'Islington',
    'N2': 'Barnet',
    'N3': 'Barnet',
    'N4': 'Haringey',
    'N5': 'Islington',
    'N6': 'Camden',
    'N7': 'Islington',
    'N8': 'Haringey',
    'N9': 'Enfield',
    'N10': 'Haringey',
    'N11': 'Barnet',
    'N12': 'Barnet',
    'N13': 'Enfield',
    'N14': 'Enfield',
    'N15': 'Haringey',
    'N16': 'Hackney',
    'N17': 'Haringey',
    'N18': 'Enfield',
    'N19': 'Islington',
    'N20': 'Barnet',
    'N21': 'Enfield',
    'N22': 'Haringey',

    # NW postcodes
    'NW1': 'Camden',
    'NW2': 'Brent',
    'NW3': 'Camden',
    'NW4': 'Barnet',
    'NW5': 'Camden',
    'NW6': 'Camden',
    'NW7': 'Barnet',
    'NW8': 'Westminster',
    'NW9': 'Brent',
    'NW10': 'Brent',
    'NW11': 'Barnet',

    # SE postcodes
    'SE1': 'Southwark',
    'SE2': 'Greenwich',
    'SE3': 'Greenwich',
    'SE4': 'Lewisham',
    'SE5': 'Southwark',
    'SE6': 'Lewisham',
    'SE7': 'Greenwich',
    'SE8': 'Lewisham',
    'SE9': 'Greenwich',
    'SE10': 'Greenwich',
    'SE11': 'Lambeth',
    'SE12': 'Lewisham',
    'SE13': 'Lewisham',
    'SE14': 'Lewisham',
    'SE15': 'Southwark',
    'SE16': 'Southwark',
    'SE17': 'Southwark',
    'SE18': 'Greenwich',
    'SE19': 'Croydon',
    'SE20': 'Bromley',
    'SE21': 'Southwark',
    'SE22': 'Southwark',
    'SE23': 'Lewisham',
    'SE24': 'Lambeth',
    'SE25': 'Croydon',
    'SE26': 'Lewisham',
    'SE27': 'Lambeth',
    'SE28': 'Greenwich',

    # SW postcodes
    'SW1': 'Westminster',
    'SW1A': 'Westminster',
    'SW1E': 'Westminster',
    'SW1H': 'Westminster',
    'SW1P': 'Westminster',
    'SW1V': 'Westminster',
    'SW1W': 'Westminster',
    'SW1X': 'Westminster',
    'SW1Y': 'Westminster',
    'SW2': 'Lambeth',
    'SW3': 'Kensington and Chelsea',
    'SW4': 'Lambeth',
    'SW5': 'Kensington and Chelsea',
    'SW6': 'Hammersmith and Fulham',
    'SW7': 'Kensington and Chelsea',
    'SW8': 'Lambeth',
    'SW9': 'Lambeth',
    'SW10': 'Kensington and Chelsea',
    'SW11': 'Wandsworth',
    'SW12': 'Wandsworth',
    'SW13': 'Richmond upon Thames',
    'SW14': 'Richmond upon Thames',
    'SW15': 'Wandsworth',
    'SW16': 'Lambeth',
    'SW17': 'Wandsworth',
    'SW18': 'Wandsworth',
    'SW19': 'Merton',
    'SW20': 'Merton',

    # W postcodes
    'W1': 'Westminster',
    'W1A': 'Westminster',
    'W1B': 'Westminster',
    'W1C': 'Westminster',
    'W1D': 'Westminster',
    'W1F': 'Westminster',
    'W1G': 'Westminster',
    'W1H': 'Westminster',
    'W1J': 'Westminster',
    'W1K': 'Westminster',
    'W1S': 'Westminster',
    'W1T': 'Camden',
    'W1U': 'Westminster',
    'W1W': 'Westminster',
    'W2': 'Westminster',
    'W3': 'Ealing',
    'W4': 'Hounslow',
    'W5': 'Ealing',
    'W6': 'Hammersmith and Fulham',
    'W7': 'Ealing',
    'W8': 'Kensington and Chelsea',
    'W9': 'Westminster',
    'W10': 'Kensington and Chelsea',
    'W11': 'Kensington and Chelsea',
    'W12': 'Hammersmith and Fulham',
    'W13': 'Ealing',
    'W14': 'Hammersmith and Fulham',

    # WC postcodes
    'WC1': 'Camden',
    'WC1A': 'Camden',
    'WC1B': 'Camden',
    'WC1E': 'Camden',
    'WC1H': 'Camden',
    'WC1N': 'Camden',
    'WC1R': 'Camden',
    'WC1V': 'Camden',
    'WC1X': 'Islington',
    'WC2': 'Westminster',
    'WC2A': 'Westminster',
    'WC2B': 'Camden',
    'WC2E': 'Westminster',
    'WC2H': 'Westminster',
    'WC2N': 'Westminster',
    'WC2R': 'Westminster',

    # Outer London postcodes
    # BR - Bromley
    'BR1': 'Bromley',
    'BR2': 'Bromley',
    'BR3': 'Bromley',
    'BR4': 'Bromley',
    'BR5': 'Bromley',
    'BR6': 'Bromley',
    'BR7': 'Bromley',

    # CR - Croydon
    'CR0': 'Croydon',
    'CR2': 'Croydon',
    'CR4': 'Merton',
    'CR5': 'Croydon',
    'CR7': 'Croydon',
    'CR8': 'Croydon',
    'CR9': 'Croydon',

    # DA - Bexley
    'DA1': 'Bexley',
    'DA5': 'Bexley',
    'DA6': 'Bexley',
    'DA7': 'Bexley',
    'DA8': 'Bexley',
    'DA14': 'Bexley',
    'DA15': 'Bexley',
    'DA16': 'Bexley',
    'DA17': 'Bexley',
    'DA18': 'Greenwich',

    # EN - Enfield
    'EN1': 'Enfield',
    'EN2': 'Enfield',
    'EN3': 'Enfield',
    'EN4': 'Barnet',
    'EN5': 'Barnet',

    # HA - Harrow / Hillingdon
    'HA0': 'Brent',
    'HA1': 'Harrow',
    'HA2': 'Harrow',
    'HA3': 'Harrow',
    'HA4': 'Hillingdon',
    'HA5': 'Harrow',
    'HA6': 'Hillingdon',
    'HA7': 'Harrow',
    'HA8': 'Barnet',
    'HA9': 'Brent',

    # IG - Redbridge / Barking and Dagenham
    'IG1': 'Redbridge',
    'IG2': 'Redbridge',
    'IG3': 'Redbridge',
    'IG4': 'Redbridge',
    'IG5': 'Redbridge',
    'IG6': 'Redbridge',
    'IG7': 'Redbridge',
    'IG8': 'Redbridge',
    'IG11': 'Barking and Dagenham',

    # KT - Kingston upon Thames
    'KT1': 'Kingston upon Thames',
    'KT2': 'Kingston upon Thames',
    'KT3': 'Kingston upon Thames',
    'KT4': 'Sutton',
    'KT5': 'Kingston upon Thames',
    'KT6': 'Kingston upon Thames',
    'KT9': 'Kingston upon Thames',

    # RM - Havering / Barking and Dagenham
    'RM1': 'Havering',
    'RM2': 'Havering',
    'RM3': 'Havering',
    'RM4': 'Havering',
    'RM5': 'Havering',
    'RM6': 'Barking and Dagenham',
    'RM7': 'Havering',
    'RM8': 'Barking and Dagenham',
    'RM9': 'Barking and Dagenham',
    'RM10': 'Barking and Dagenham',
    'RM11': 'Havering',
    'RM12': 'Havering',
    'RM13': 'Havering',
    'RM14': 'Havering',

    # SM - Sutton
    'SM1': 'Sutton',
    'SM2': 'Sutton',
    'SM3': 'Sutton',
    'SM4': 'Merton',
    'SM5': 'Sutton',
    'SM6': 'Sutton',

    # TW - Hounslow / Richmond
    'TW1': 'Richmond upon Thames',
    'TW2': 'Richmond upon Thames',
    'TW3': 'Hounslow',
    'TW4': 'Hounslow',
    'TW5': 'Hounslow',
    'TW6': 'Hillingdon',
    'TW7': 'Hounslow',
    'TW8': 'Hounslow',
    'TW9': 'Richmond upon Thames',
    'TW10': 'Richmond upon Thames',
    'TW11': 'Richmond upon Thames',
    'TW12': 'Richmond upon Thames',
    'TW13': 'Hounslow',
    'TW14': 'Hounslow',

    # UB - Hillingdon / Ealing
    'UB1': 'Ealing',
    'UB2': 'Ealing',
    'UB3': 'Hillingdon',
    'UB4': 'Hillingdon',
    'UB5': 'Ealing',
    'UB6': 'Ealing',
    'UB7': 'Hillingdon',
    'UB8': 'Hillingdon',
    'UB9': 'Hillingdon',
    'UB10': 'Hillingdon',
    'UB11': 'Hillingdon',
}


from typing import Optional


def lookup_borough(postcode: str) -> Optional[str]:
    """
    Given a UK postcode string, extract the outward code and look up the
    corresponding London borough.  Returns None if not a London postcode.

    Tries the most specific match first (e.g. SW1A), then falls back to
    shorter prefixes (SW1, SW).
    """
    clean = postcode.upper().strip().replace(' ', '')
    if len(clean) < 3:
        return None

    # The outward code is everything except the last 3 characters (the inward code)
    outward = clean[:-3].strip()
    if not outward:
        return None

    # Try most specific first, then shorten
    for length in range(len(outward), 0, -1):
        prefix = outward[:length]
        if prefix in POSTCODE_TO_BOROUGH:
            return POSTCODE_TO_BOROUGH[prefix]

    return None
