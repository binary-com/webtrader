import subprocess, os, fnmatch, re
from HTMLParser import HTMLParser

# Unfortunately there are no easy way to extract strings from .js files
# This array will be added to generator .po files regardless of contents in html files.
static = [
    'View', 'Total Profit/Loss', 'Asset Index', 'Downloading .csv',
    'Error downloading .csv', 'Download PNG', 'Download SVG', 'Download CSV',
    'Remove Selected', 'Cancel', 'Double click the object to remove.',
    'Horizontal Line', 'Stroke width', 'Stroke color', 'Vertical Line',
    'Please enter a value for', 'between', 'and', 'Add/remove overlays',
    'Chrome Extension', 'Do you want to install Webtrader chrome extension?',
    'days', 'day', 'hours', 'hour', 'minutes', 'minute', 'seconds', 'second',
    'Change Backend Server', 'Apply', 'Reset to Defaults', 'Config changes successful',
    'Reloading page', 'Ticks', 'Minutes', 'Hours', 'Days', 'Loading Trading Times',
    'Loading Token management', 'Loading Password dialog', 'Loading Asset Index',
    'Loading portfolio', 'Loading Real account openning', 'Loading Profit Table',
    'Loading Statement Table', 'Loading Download/View Data', 'Loading Self-Exclusion',
    'Loading Configurations', 'Loading custom theme configuration', 'Please try again after 1 minute',
    'Loading chart and trade menus', 'Please enter your password', 'Password must be 6 characters minimum',
    'Password must contain lower and uppercase letters with numbers', 'Log in',  'Registration',
    'Account opening', 'Verification code sent to ', 'Email verification failed', 'Change password',
    'Please enter your new password', 'Password must be 6 characters minimum',
    'Password must contain uppercase letters and numbers',  'Failed to update the password',
    'Password successfully updated.', 'Redirecting to oauth login page',
    'Please use your new password to login', 'Portfolio', 'Account balance', 'View',
    'Profit Table', 'Total Profit/Loss',  'Jump to',  'Real account opening',
    'Mother\'s maiden name', 'Name of your pet', 'Name of first love',
    'Memorable town/city', 'Memorable date', 'Favourite dish', 'Brand of first car',
    'Favourite artist','Mr', 'Mrs', 'Ms', 'Miss', '0-1 year', '1-2 years', 'Over 3 years',
    '0-5 transactions in the past 12 months', '6-10 transactions in the past 12 months', '40 transactions or more in the past 12 months',
    'Construction', 'Education', 'Finance', 'Health', 'Tourism', 'Other','Primary', 'Secondary', 'Tertiary',
    'Salaried Employee', 'Self-Employed', 'Investments & Dividends', 'Pension', 'Other', 'Less than', 'Over', 

]

# Parsing webtrader html files.
class WebtraderParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.is_script = False
        self.texts = static
    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.is_script = True
    def handle_endtag(self, tag):
        if tag == 'script':
            self.is_script = False
    def handle_data(self, text):
        if not self.is_script: # ignore script tags
            text = re.sub( '\s+', ' ', text).strip()
            if text != '' and len(text) > 1: # ignore empty and single character strings.
                if text[0] == '{' and text[-1] == '}': return #ignore rivetsjs tags
                self.texts.append(text)
    def parse_html_files(self, path):
        file_pattern = "*.html"
        for path, dirs, files in os.walk(path):
            for file_name in fnmatch.filter(files, file_pattern):
                file_path = os.path.join(path, file_name)
                with open(file_path) as f:
                    html = f.read()
                    self.feed(html);
            for dir in dirs:
                self.parse_html_files(os.path.join(path, dir))
    def get_texts(self):
        return sorted(set(self.texts)) # sort and remove duplicates

parser = WebtraderParser()
parser.parse_html_files('../src')
texts = parser.get_texts()

messages_pot = './translations/messages.pot'

os.remove(messages_pot);
with open(messages_pot, 'a+') as wf:
    for text in texts:
        text = text.replace('"', '\\"')
        text = re.sub(r'[^\x00-\x7F]+',' ', text) # remove non aski characters
        wf.write('\n' + 'msgid "' + text + '"'      )
        wf.write('\nmsgstr "" \n')

files = [
    './translations/ar.po',
    './translations/de.po',
    './translations/en.po',
    './translations/es.po',
    './translations/fr.po',
    './translations/id.po',
    './translations/it.po',
    './translations/ja.po',
    './translations/pl.po',
    './translations/pt.po',
    './translations/ru.po',
    './translations/vi.po',
    './translations/zh_cn.po',
    './translations/zh_tw.po',
]

# on OSX install the 'msgmerge' command via homebrow
# brew install gettext
# brew link gettext --force
for f in files:
    subprocess.call(['msgmerge', '--output-file=' + f, f, './translations/messages.pot'])

# to extract translated string from a to b
# msgmerge -N -o translations/zh_tw.po temp/zh_tw.po ref/zh_tw.po
